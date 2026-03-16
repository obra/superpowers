# Action Text

> Rich text editing with sanitizer config and remote images.

---

## Sanitizer Configuration in Production

**PR**: [#873](https://github.com/basecamp/fizzy/pull/873)

**Problem**: In production with eager loading enabled, Action Text's default sanitizer config doesn't automatically inherit from your custom Rails sanitizer settings. This means tags/attributes you've whitelisted for the rest of your app won't work in Action Text content.

**Solution**: Explicitly sync Action Text's allowed tags and attributes with your Rails sanitizer config in an initializer:

```ruby
# config/initializers/sanitization.rb
Rails.application.config.after_initialize do
  # Add custom tags and attributes to Rails sanitizer
  Rails::HTML5::SafeListSanitizer.allowed_tags.merge(%w[ s table tr td th thead tbody details summary video source ])
  Rails::HTML5::SafeListSanitizer.allowed_attributes.merge(%w[ data-turbo-frame controls type width data-action data-lightbox-target ])

  # CRITICAL: Explicitly sync with Action Text in production
  ActionText::ContentHelper.allowed_tags = Rails::HTML5::SafeListSanitizer.allowed_tags
  ActionText::ContentHelper.allowed_attributes = Rails::HTML5::SafeListSanitizer.allowed_attributes
end
```

**Why it matters**: Without this, you'll see inconsistent behavior between development (works) and production (silently strips tags/attributes), leading to confusing bugs that only appear after deployment.

**Testing**: Add tests that verify data attributes and custom tags survive sanitization:

```ruby
# test/helpers/action_text_rendering_test.rb
class ActionTextRenderingTest < ActionView::TestCase
  test "custom data attributes in content are preserved" do
    html = '<p><a href="#" data-turbo-frame="modal">Open modal</a></p>'
    content = ActionText::Content.new(html)
    rendered = content.to_s

    assert_match(/data-turbo-frame="modal"/, rendered)
  end
end
```

---

## 2. Custom HTML Processing at Render Time

**PR**: [#564](https://github.com/basecamp/fizzy/pull/564)

**Pattern**: Override Action Text's content layout to apply custom HTML transformations (like autolinking) at render time, not at save time.

**Implementation**:

```ruby
# app/helpers/html_helper.rb
module HtmlHelper
  include ERB::Util

  EXCLUDE_PUNCTUATION = %(.?,:!;"'<>)
  EXCLUDE_PUNCTUATION_REGEX = /[#{Regexp.escape(EXCLUDE_PUNCTUATION)}]+\z/

  def format_html(html)
    fragment = Nokogiri::HTML5.fragment(html)
    auto_link(fragment)
    fragment.to_html.html_safe
  end

  private
    EXCLUDED_ELEMENTS = %w[ a figcaption pre code ]
    EMAIL_AUTOLINK_REGEXP = /\b[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\b/
    URL_REGEXP = URI::DEFAULT_PARSER.make_regexp(%w[http https])

    def auto_link(fragment)
      fragment.traverse do |node|
        next unless auto_linkable_node?(node)

        # Escape HTML to prevent creating tags where there aren't any
        content = h(node.text)
        linked_content = content.dup

        auto_link_urls(linked_content)
        auto_link_emails(linked_content)

        if linked_content != content
          node.replace(Nokogiri::HTML5.fragment(linked_content))
        end
      end
    end

    def auto_linkable_node?(node)
      node.text? && node.ancestors.none? { |ancestor| EXCLUDED_ELEMENTS.include?(ancestor.name) }
    end

    def auto_link_urls(linked_content)
      linked_content.gsub!(URL_REGEXP) do |match|
        url, trailing_punct = extract_url_and_punctuation(match)
        %(<a href="#{url}" rel="noreferrer">#{url}</a>#{trailing_punct})
      end
    end

    def extract_url_and_punctuation(url_match)
      url_match = CGI.unescapeHTML(url_match)
      if match = url_match.match(EXCLUDE_PUNCTUATION_REGEX)
        len = match[0].length
        [ url_match[..-(len+1)], url_match[-len..] ]
      else
        [ url_match, "" ]
      end
    end

    def auto_link_emails(text)
      text.gsub!(EMAIL_AUTOLINK_REGEXP) do |match|
        %(<a href="mailto:#{match}">#{match}</a>)
      end
    end
end
```

Override the Action Text content layout:

```erb
<!-- app/views/layouts/action_text/contents/_content.html.erb -->
<div class="action-text-content">
  <%= format_html yield -%>
</div>
```

**Why it matters**:
- **Flexibility**: Render-time transformations mean you can update the logic without migrating existing content
- **Preservation**: Original user content stays pristine in the database
- **Future-proof**: If you later add autolinking to your editor, existing content will already be ready

**Testing pattern**: Test the helper thoroughly, especially edge cases:

```ruby
# test/helpers/html_helper_test.rb
class HtmlHelperTest < ActionView::TestCase
  test "convert URLs into anchor tags" do
    assert_equal_html \
      %(<p>Check this: <a href="https://example.com" rel="noreferrer">https://example.com</a></p>),
      format_html("<p>Check this: https://example.com</p>")
  end

  test "don't include punctuation in URL autolinking" do
    assert_equal_html \
      %(<p>Check this: <a href="https://example.com/" rel="noreferrer">https://example.com/</a>!</p>),
      format_html("<p>Check this: https://example.com/!</p>")
  end

  test "handle URLs with query parameters" do
    assert_equal \
      %(<p>Check this: <a href="https://example.com/a?b=c&amp;d=e" rel="noreferrer">https://example.com/a?b=c&amp;d=e</a></p>),
      format_html("<p>Check this: https://example.com/a?b=c&amp;d=e</p>")
  end

  test "respect existing links" do
    assert_equal_html \
      %(<p>Check this: <a href="https://example.com">https://example.com</a></p>),
      format_html("<p>Check this: <a href=\"https://example.com\">https://example.com</a></p>")
  end

  test "don't autolink content in excluded elements" do
    %w[ figcaption pre code ].each do |element|
      assert_equal_html \
        "<#{element}>Check this: https://example.com</#{element}>",
        format_html("<#{element}>Check this: https://example.com</#{element}>")
    end
  end

  test "preserve escaped HTML containing URLs" do
    input = 'before text &lt;img src="https://example.com/image.png"&gt; after text'
    output = format_html(input)

    assert_no_match(/<img/, output, "should not create an img element")
    assert_includes output, "&lt;img"
  end
end
```

---

## 3. Link Retargeting for Turbo Frame Escaping

**PR**: [#564](https://github.com/basecamp/fizzy/pull/564)

**Pattern**: Use a Stimulus controller to automatically retarget links in rich text content based on domain.

**Why it matters**:
- Internal links should escape Turbo Frames (`target="_top"`) to navigate the full page
- External links should open in new tabs (`target="_blank"`) for better UX
- Doing this client-side keeps the stored content portable and domain-agnostic

**Implementation**:

```javascript
// app/javascript/controllers/retarget_links_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.element.querySelectorAll("a").forEach(this.#retargetLink.bind(this))
  }

  #retargetLink(link) {
    link.target = this.#targetsSameDomain(link) ? "_top" : "_blank"
  }

  #targetsSameDomain(link) {
    return link.href.startsWith(window.location.origin)
  }
}
```

Apply to your rich text content:

```erb
<div class="rich-text-content" data-controller="syntax-highlight retarget-links">
  <%= card.description %>
</div>
```

---

## 4. Graceful Handling of Malformed Attachments

**PR**: [#1859](https://github.com/basecamp/fizzy/pull/1859)

**Problem**: Action Text remote image attachments can fail to render if they have malformed URLs or missing attributes, causing the entire page to error.

**Solution**: Use `skip_pipeline: true` for remote images to bypass Rails' asset pipeline processing:

```erb
<!-- app/views/action_text/attachables/_remote_image.html.erb -->
<figure class="attachment attachment--preview">
  <%= image_tag remote_image.url, skip_pipeline: true, width: remote_image.width, height: remote_image.height %>
  <% if caption = remote_image.try(:caption) %>
    <figcaption class="attachment__caption">
      <%= caption %>
    </figcaption>
  <% end %>
</figure>
```

**Why it matters**:
- `skip_pipeline: true` prevents Rails from trying to process or validate remote URLs through the asset pipeline
- This avoids errors when URLs are relative, malformed, or otherwise invalid
- The browser will handle the image loading gracefully (showing broken image icon rather than crashing)

**Testing**: Create regression tests with malformed attachment HTML:

```ruby
# test/controllers/cards_controller_test.rb
test "show card with comment containing malformed remote image attachment" do
  card = cards(:logo)
  card.comments.create!(
    creator: users(:kevin),
    body: '<action-text-attachment url="image.png" content-type="image/*" presentation="gallery"></action-text-attachment>'
  )

  get card_path(card)
  assert_response :success
end
```

**Note**: This issue was [proposed as a fix to Rails itself](https://github.com/rails/rails/pull/56283), so future Rails versions may handle this better out of the box.

---

## 5. Custom Attachable Partials

**Pattern**: Override Action Text's default attachment partials to customize rendering.

**Example from Fizzy**:

```erb
<!-- app/views/action_text/attachables/_remote_video.html.erb -->
<figure class="attachment attachment--preview attachment--video">
  <%= tag.video controls: true, width: remote_video.width, height: remote_video.height do %>
    <%= tag.source src: remote_video.url, type: remote_video.content_type %>
  <% end %>
  <% if caption = remote_video.try(:caption) %>
    <figcaption class="attachment__caption">
      <%= caption %>
    </figcaption>
  <% end %>
</figure>
```

**Why it matters**:
- Full control over HTML structure and CSS classes
- Can add responsive attributes, captions, or custom functionality
- Works seamlessly with Action Text's attachable system

**Location pattern**: Rails looks for attachable partials in `app/views/action_text/attachables/_<type>.html.erb` where type comes from the attachable's class name (e.g., `RemoteImage` → `_remote_image.html.erb`).

---

## 6. Comprehensive Rich Text CSS Styling

**Pattern**: Create a dedicated `.rich-text-content` CSS scope that styles all possible HTML elements users might add.

**Key considerations from Fizzy's implementation**:

```css
/* Base styling scope */
.rich-text-content {
  --block-margin: 0.5lh;
}

/* Typography */
.rich-text-content h1, h2, h3, h4, h5, h6 {
  font-weight: 800;
  letter-spacing: -0.02ch;
  line-height: 1.1;
  margin-block: 0 var(--block-margin);
  overflow-wrap: break-word;
  text-wrap: balance;
}

/* Hide empty paragraphs (common in rich text) */
.rich-text-content p:empty {
  display: none;
}

/* Code blocks with syntax highlighting support */
.rich-text-content code[data-language],
.rich-text-content pre {
  display: block;
  overflow-x: auto;
  padding: 0.5lh 2ch;
  tab-size: 2;
  white-space: pre;
}

/* Links should hug media contained within */
.rich-text-content a:has(img),
.rich-text-content a:has(video) {
  inline-size: fit-content;
  margin-inline: auto;
}

/* Constrain media dimensions */
.rich-text-content img,
.rich-text-content video {
  inline-size: auto;
  margin-inline: auto;
  max-block-size: 32rem;
  object-fit: contain;
}
```

**Why it matters**:
- Users will find creative ways to add content you didn't expect
- Empty paragraphs from editors create unwanted spacing
- Code blocks need special handling for horizontal scrolling
- Media elements need responsive constraints

---

## 7. Testing Helpers for Rich Text

**Pattern**: Create reusable test helpers that normalize HTML for comparison.

```ruby
# test/test_helpers/action_text_test_helper.rb
module ActionTextTestHelper
  def assert_action_text(expected_html, content)
    assert_equal_html <<~HTML, content.to_s
      <div class="action-text-content">#{expected_html}</div>
    HTML
  end

  def assert_equal_html(expected, actual)
    assert_equal normalize_html(expected), normalize_html(actual)
  end

  def normalize_html(html)
    Nokogiri::HTML.fragment(html).tap do |fragment|
      fragment.traverse do |node|
        if node.text?
          node.content = node.text.squish
        end
      end
    end.to_html.strip
  end
end
```

**Why it matters**:
- HTML comparison is fragile due to whitespace, attribute ordering, etc.
- Normalizing HTML makes tests resilient to formatting changes
- `squish` removes extra whitespace while preserving semantics

**Usage**:

```ruby
class HtmlHelperTest < ActionView::TestCase
  include ActionTextTestHelper

  test "converts URLs into anchor tags" do
    assert_equal_html \
      %(<p>Check: <a href="https://example.com">https://example.com</a></p>),
      format_html("<p>Check: https://example.com</p>")
  end
end
```

---

## 8. Rich Text Applied to Forms (Edge Case)

**PR**: [#912](https://github.com/basecamp/fizzy/pull/912)

**Problem**: When applying `.rich-text-content` CSS to a form containing Action Text fields, the styles may not apply to newly created records until the page refreshes.

**Solution**: Apply the `rich-text-content` class to the form element itself, not just the display containers:

```erb
<%= form_with model: card, class: "rich-text-content", data: { controller: "auto-save" } do |form| %>
  <%= form.rich_text_area :description %>
<% end %>
```

**Why it matters**:
- Ensures consistent styling between edit and display modes
- Particularly important for inline editing patterns
- Prevents visual "flash" when switching between modes

---

## Summary of Key Takeaways

1. **Always sync sanitizer config** between Rails and Action Text in production
2. **Process HTML at render time** (not save time) for maximum flexibility
3. **Use Stimulus for client-side enhancements** like link retargeting
4. **Use `skip_pipeline: true`** for remote images to prevent errors
5. **Override attachment partials** for complete rendering control
6. **Style defensively** - users will create unexpected HTML
7. **Create test helpers** for reliable HTML comparison
8. **Test edge cases** like malformed attachments and entity-encoded punctuation

These patterns make Action Text robust, flexible, and maintainable in production Rails applications.
