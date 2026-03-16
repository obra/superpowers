# Controllers

> Thin controllers, rich models, and composable concerns.

---

## Core Principle: Thin Controllers, Rich Models

Controllers should be thin orchestrators. Business logic lives in models.

```ruby
# GOOD: Controller just orchestrates
class Cards::ClosuresController < ApplicationController
  include CardScoped

  def create
    @card.close  # All logic in model

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.json { head :no_content }
    end
  end

  def destroy
    @card.reopen  # All logic in model

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.json { head :no_content }
    end
  end
end
```

```ruby
# BAD: Business logic in controller
class Cards::ClosuresController < ApplicationController
  def create
    @card.transaction do
      @card.create_closure!(user: Current.user)
      @card.events.create!(action: :closed, creator: Current.user)
      @card.watchers.each { |w| NotificationMailer.card_closed(w, @card).deliver_later }
    end
  end
end
```

## ApplicationController is Minimal

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include Authentication
  include Authorization
  include BlockSearchEngineIndexing
  include CurrentRequest, CurrentTimezone, SetPlatform
  include RequestForgeryProtection
  include TurboFlash, ViewTransitions
  include RoutingHeaders

  etag { "v1" }
  stale_when_importmap_changes
  allow_browser versions: :modern
end
```

## Authorization: Controller Checks, Model Defines

```ruby
# Controller checks permission
class CardsController < ApplicationController
  before_action :ensure_permission_to_administer_card, only: [:destroy]

  private
    def ensure_permission_to_administer_card
      head :forbidden unless Current.user.can_administer_card?(@card)
    end
end

# Model defines what permission means
class User < ApplicationRecord
  def can_administer_card?(card)
    admin? || card.creator == self
  end

  def can_administer_board?(board)
    admin? || board.creator == self
  end
end
```

---

## Controller Concerns Catalog

Controller concerns create a vocabulary of reusable behaviors that compose beautifully.

### Resource Scoping Concerns

#### CardScoped - For Card Sub-resources

```ruby
# app/controllers/concerns/card_scoped.rb
module CardScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_card, :set_board
  end

  private
    def set_card
      @card = Current.user.accessible_cards.find_by!(number: params[:card_id])
    end

    def set_board
      @board = @card.board
    end

    def render_card_replacement
      render turbo_stream: turbo_stream.replace(
        [@card, :card_container],
        partial: "cards/container",
        method: :morph,
        locals: { card: @card.reload }
      )
    end
end
```

**Usage Pattern:**

```ruby
# Any controller nested under cards uses this
class Cards::ClosuresController < ApplicationController
  include CardScoped

  def create
    @card.close
    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.json { head :no_content }
    end
  end
end

class Cards::WatchesController < ApplicationController
  include CardScoped

  def create
    @card.watch_by Current.user
    # ...
  end
end

class Cards::PinsController < ApplicationController
  include CardScoped

  def create
    @pin = @card.pin_by Current.user
    # ...
  end
end
```

**Key insight:** The concern provides `render_card_replacement` - a shared way to update the card UI.

#### BoardScoped - For Board Sub-resources

```ruby
# app/controllers/concerns/board_scoped.rb
module BoardScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_board
  end

  private
    def set_board
      @board = Current.user.boards.find(params[:board_id])
    end

    def ensure_permission_to_admin_board
      unless Current.user.can_administer_board?(@board)
        head :forbidden
      end
    end
end
```

**Usage:**

```ruby
class Boards::ColumnsController < ApplicationController
  include BoardScoped

  def create
    @column = @board.columns.create!(column_params)
  end
end

class Boards::PublicationsController < ApplicationController
  include BoardScoped
  before_action :ensure_permission_to_admin_board

  def create
    @board.publish
  end
end
```

#### ColumnScoped - For Column Sub-resources

```ruby
# app/controllers/concerns/column_scoped.rb
module ColumnScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_column
  end

  private
    def set_column
      @column = Current.user.accessible_columns.find(params[:column_id])
    end
end
```

---

### Request Context Concerns

#### CurrentRequest - Populate Current with Request Data

```ruby
# app/controllers/concerns/current_request.rb
module CurrentRequest
  extend ActiveSupport::Concern

  included do
    before_action do
      Current.http_method = request.method
      Current.request_id  = request.uuid
      Current.user_agent  = request.user_agent
      Current.ip_address  = request.ip
      Current.referrer    = request.referrer
    end
  end
end
```

**Why this matters:** Models and jobs can access request context via `Current` without parameter passing:

```ruby
class Signup
  def create_identity
    Identity.create!(
      email_address: email_address,
      # These come from Current, not parameters!
      ip_address: Current.ip_address,
      user_agent: Current.user_agent
    )
  end
end
```

#### CurrentTimezone - User Timezone from Cookie

```ruby
# app/controllers/concerns/current_timezone.rb
module CurrentTimezone
  extend ActiveSupport::Concern

  included do
    around_action :set_current_timezone
    helper_method :timezone_from_cookie
    etag { timezone_from_cookie }
  end

  private
    def set_current_timezone(&)
      Time.use_zone(timezone_from_cookie, &)
    end

    def timezone_from_cookie
      @timezone_from_cookie ||= begin
        timezone = cookies[:timezone]
        ActiveSupport::TimeZone[timezone] if timezone.present?
      end
    end
end
```

**Key patterns:**
1. `around_action` wraps the entire request in the user's timezone
2. `etag` includes timezone - different timezones get different cached responses
3. `helper_method` makes it available in views
4. Cookie is set client-side by JavaScript detecting the user's timezone

#### SetPlatform - Detect Mobile/Desktop

```ruby
# app/controllers/concerns/set_platform.rb
module SetPlatform
  extend ActiveSupport::Concern

  included do
    helper_method :platform
  end

  private
    def platform
      @platform ||= ApplicationPlatform.new(request.user_agent)
    end
end
```

**Usage in views:**

```erb
<% if platform.mobile? %>
  <%= render "mobile_nav" %>
<% else %>
  <%= render "desktop_nav" %>
<% end %>
```

---

### Filtering & Pagination Concerns

#### FilterScoped - Complex Filtering

```ruby
# app/controllers/concerns/filter_scoped.rb
module FilterScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_filter
    before_action :set_user_filtering
  end

  private
    def set_filter
      if params[:filter_id].present?
        @filter = Current.user.filters.find(params[:filter_id])
      else
        @filter = Current.user.filters.from_params(filter_params)
      end
    end

    def filter_params
      params.reverse_merge(**Filter.default_values)
            .permit(*Filter::PERMITTED_PARAMS)
    end

    def set_user_filtering
      @user_filtering = User::Filtering.new(Current.user, @filter, expanded: expanded_param)
    end
end
```

**The Filter model does the heavy lifting:**

```ruby
class Filter < ApplicationRecord
  def cards
    result = creator.accessible_cards.preloaded.published
    result = result.indexed_by(indexed_by)
    result = result.sorted_by(sorted_by)
    result = result.where(board: boards.ids) if boards.present?
    result = result.tagged_with(tags.ids) if tags.present?
    result = result.assigned_to(assignees.ids) if assignees.present?
    # ... more filtering
    result.distinct
  end
end
```

**Pattern:** Filters are persisted! Users can save and name their filters.

---

### Security & Headers Concerns

#### BlockSearchEngineIndexing - Prevent Crawling

```ruby
# app/controllers/concerns/block_search_engine_indexing.rb
module BlockSearchEngineIndexing
  extend ActiveSupport::Concern

  included do
    after_action :block_search_engine_indexing
  end

  private
    def block_search_engine_indexing
      headers["X-Robots-Tag"] = "none"
    end
end
```

**Why:** Private app content shouldn't appear in search results.

#### RequestForgeryProtection - Modern CSRF

```ruby
# app/controllers/concerns/request_forgery_protection.rb
module RequestForgeryProtection
  extend ActiveSupport::Concern

  included do
    after_action :append_sec_fetch_site_to_vary_header
  end

  private
    def append_sec_fetch_site_to_vary_header
      vary_header = response.headers["Vary"].to_s.split(",").map(&:strip).reject(&:blank?)
      response.headers["Vary"] = (vary_header + ["Sec-Fetch-Site"]).join(",")
    end

    def verified_request?
      request.get? || request.head? || !protect_against_forgery? ||
        (valid_request_origin? && safe_fetch_site?)
    end

    SAFE_FETCH_SITES = %w[same-origin same-site]

    def safe_fetch_site?
      SAFE_FETCH_SITES.include?(sec_fetch_site_value) ||
        (sec_fetch_site_value.nil? && api_request?)
    end

    def api_request?
      request.format.json?
    end
end
```

**Modern approach:** Uses `Sec-Fetch-Site` header instead of tokens. Browsers set this automatically.

---

### Turbo/View Concerns

#### TurboFlash - Flash Messages via Turbo Stream

```ruby
# app/controllers/concerns/turbo_flash.rb
module TurboFlash
  extend ActiveSupport::Concern

  included do
    helper_method :turbo_stream_flash
  end

  private
    def turbo_stream_flash(**flash_options)
      turbo_stream.replace(:flash, partial: "layouts/shared/flash", locals: { flash: flash_options })
    end
end
```

**Usage in controller:**

```ruby
def create
  @comment = @card.comments.create!(comment_params)

  respond_to do |format|
    format.turbo_stream do
      render turbo_stream: [
        turbo_stream.append(:comments, @comment),
        turbo_stream_flash(notice: "Comment added!")
      ]
    end
  end
end
```

#### ViewTransitions - Disable on Refresh

```ruby
# app/controllers/concerns/view_transitions.rb
module ViewTransitions
  extend ActiveSupport::Concern

  included do
    before_action :disable_view_transitions, if: :page_refresh?
  end

  private
    def disable_view_transitions
      @disable_view_transition = true
    end

    def page_refresh?
      request.referrer.present? && request.referrer == request.url
    end
end
```

**Why:** View transitions on page refresh look weird. This disables them automatically.

---

## Composing Concerns: Real Controllers

Here's how concerns compose in practice:

```ruby
# A full-featured nested controller
class Cards::AssignmentsController < ApplicationController
  include CardScoped  # Gets @card, @board, render_card_replacement

  def new
    @assigned_to = @card.assignees.active.alphabetically.where.not(id: Current.user)
    @users = @board.users.active.alphabetically.where.not(id: @card.assignees)
    fresh_when etag: [@users, @card.assignees]  # HTTP caching!
  end

  def create
    @card.toggle_assignment @board.users.active.find(params[:assignee_id])

    respond_to do |format|
      format.turbo_stream
      format.json { head :no_content }
    end
  end
end
```

```ruby
# A timeline controller composing multiple concerns
class Events::Days::ColumnsController < ApplicationController
  include DayTimelinesScoped  # Which includes FilterScoped

  def show
    @column = @board.columns.find(params[:id])
  end
end
```

## Concern Composition Rules

1. **Concerns can include other concerns:**
   ```ruby
   module DayTimelinesScoped
     include FilterScoped  # Inherits all of FilterScoped
     # ...
   end
   ```

2. **Use `before_action` in `included` block:**
   ```ruby
   included do
     before_action :set_card
   end
   ```

3. **Provide shared private methods:**
   ```ruby
   def render_card_replacement
     # Reusable across all CardScoped controllers
   end
   ```

4. **Use `helper_method` for view access:**
   ```ruby
   included do
     helper_method :platform, :timezone_from_cookie
   end
   ```

5. **Add to `etag` for HTTP caching:**
   ```ruby
   included do
     etag { timezone_from_cookie }
   end
   ```
