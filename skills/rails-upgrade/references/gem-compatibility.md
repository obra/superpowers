# Gem Compatibility Reference

Common gems and their minimum required versions per Rails release. Check these before upgrading — a gem that doesn't support your target Rails version will block the upgrade.

## Upgrade Order

1. Ruby (upgrade Ruby first, before Rails)
2. Rails (one minor version at a time)
3. Critical gems (authentication, authorization, database adapters)
4. Testing gems (rspec-rails, factory_bot_rails, capybara)
5. Remaining gems

## How to Check Compatibility

```bash
# See what gems are outdated
bundle outdated

# Check a specific gem's release history
gem list <gemname>
```

- Check **RubyGems.org** for the gem's changelog and required Ruby/Rails versions
- Check the gem's **GitHub issues** and open PRs for known Rails compatibility problems
- Search for `rails X.Y` in the gem's issues to find reports

## When a Gem Blocks Your Upgrade

1. Check for open PRs adding support for your target Rails version
2. Check for community forks (search GitHub)
3. Consider replacing the gem with a maintained alternative
4. As a last resort, pin Rails and wait for the gem to catch up

---

## Authentication & Authorization

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| devise | 4.5+ | 4.7+ | 4.7+ | 4.8+ | 4.9+ | 4.9+ | 4.9.4+ | 4.9.4+ |
| cancancan | 2.3+ | 3.0+ | 3.0+ | 3.3+ | 3.4+ | 3.5+ | 3.6+ | 3.6+ |
| pundit | 2.0+ | 2.0+ | 2.0+ | 2.2+ | 2.3+ | 2.3+ | 2.4+ | 2.4+ |
| rolify | 5.2+ | 6.0+ | 6.0+ | 6.0+ | 6.0+ | 6.0+ | 6.0+ | 6.0+ |
| doorkeeper | 5.0+ | 5.2+ | 5.4+ | 5.5+ | 5.6+ | 5.6+ | 5.7+ | 5.7+ |

---

## Background Jobs

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| sidekiq | 5.2+ | 6.0+ | 6.0+ | 6.4+ | 7.0+ | 7.0+ | 7.2+ | 7.3.3+ [^1] |
| resque | 2.0+ | 2.0+ | 2.0+ | 2.2+ | 2.4+ | 2.4+ | 2.6+ | 2.6+ |
| delayed_job | 4.1+ | 4.1+ | 4.1+ | 4.1+ | 4.1+ | 4.1+ | 4.1+ | 4.1+ |
| good_job | N/A | 1.0+ | 2.0+ | 3.0+ | 3.7+ | 3.10+ | 4.0+ | 4.0+ |
| solid_queue | N/A | N/A | N/A | N/A | N/A | N/A | 1.0+ | 1.0+ |
| sucker_punch | 2.0+ | 2.1+ | 2.1+ | 2.1+ | 2.1+ | 3.0+ | 3.0+ | 3.2+ [^2] |

[^1]: Rails 8.1 removed the built-in Sidekiq adapter. Requires sidekiq gem 7.3.3+ which ships its own adapter.
[^2]: Rails 8.1 removed the built-in SuckerPunch adapter. Requires sucker_punch gem 3.2+ which ships its own adapter.

---

## Testing

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| rspec-rails | 3.8+ | 4.0+ | 4.0+ | 5.0+ | 6.0+ | 6.0+ | 6.1+ | 6.1+ |
| factory_bot_rails | 4.11+ | 5.0+ | 6.0+ | 6.2+ | 6.2+ | 6.2+ | 6.4+ | 6.4+ |
| capybara | 3.12+ | 3.28+ | 3.32+ | 3.36+ | 3.38+ | 3.38+ | 3.40+ | 3.40+ |
| shoulda-matchers | 3.1+ | 4.0+ | 4.4+ | 5.0+ | 5.3+ | 5.3+ | 6.0+ | 6.0+ |
| webmock | 3.4+ | 3.7+ | 3.10+ | 3.14+ | 3.18+ | 3.18+ | 3.20+ | 3.20+ |
| vcr | 4.0+ | 5.0+ | 6.0+ | 6.0+ | 6.1+ | 6.1+ | 6.2+ | 6.2+ |

---

## API & Serialization

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| jbuilder | 2.7+ | 2.9+ | 2.10+ | 2.11+ | 2.11+ | 2.11+ | 2.12+ | 2.12+ |
| active_model_serializers | 0.10+ | 0.10+ | 0.10+ | 0.10+ | 0.10+ | 0.10+ | 0.10+ | 0.10+ |
| jsonapi-serializer | N/A | 2.0+ | 2.1+ | 2.2+ | 2.2+ | 2.2+ | 2.2+ | 2.2+ |
| grape | 1.2+ | 1.3+ | 1.5+ | 1.6+ | 2.0+ | 2.0+ | 2.1+ | 2.1+ |
| graphql | 1.8+ | 1.9+ | 1.11+ | 2.0+ | 2.1+ | 2.1+ | 2.2+ | 2.2+ |

---

## File Handling

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| shrine | 2.16+ | 3.0+ | 3.3+ | 3.4+ | 3.5+ | 3.5+ | 3.6+ | 3.6+ |
| carrierwave | 1.3+ | 2.0+ | 2.1+ | 2.2+ | 3.0+ | 3.0+ | 3.0+ | 3.0+ |
| paperclip | 6.0+ | Deprecated | N/A | N/A | N/A | N/A | N/A | N/A |
| mini_magick | 4.9+ | 4.10+ | 4.11+ | 4.12+ | 4.12+ | 4.12+ | 5.0+ | 5.0+ |
| image_processing | 1.7+ | 1.10+ | 1.12+ | 1.12+ | 1.12+ | 1.12+ | 1.12+ | 1.12+ |

Note: `paperclip` was deprecated when Rails 5.2 introduced Active Storage. Migrate to Active Storage or carrierwave/shrine.

---

## Pagination

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| kaminari | 1.1+ | 1.2+ | 1.2+ | 1.2+ | 1.2+ | 1.2+ | 1.2+ | 1.2+ |
| will_paginate | 3.1+ | 3.3+ | 3.3+ | 4.0+ | 4.0+ | 4.0+ | 4.0+ | 4.0+ |
| pagy | 2.0+ | 3.0+ | 4.0+ | 5.0+ | 6.0+ | 7.0+ | 8.0+ | 9.0+ |

Note: `pagy` tracks Rails releases closely — each major pagy version tends to align with a new Rails minor.

---

## Admin & CMS

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| activeadmin | 2.0+ | 2.6+ | 2.9+ | 2.13+ | 3.0+ | 3.1+ | 3.2+ | 3.2+ |
| rails_admin | 2.0+ | 2.2+ | 3.0+ | 3.1+ | 3.1+ | 3.2+ | 3.2+ | 3.2+ |
| administrate | 0.11+ | 0.13+ | 0.16+ | 0.17+ | 0.19+ | 0.19+ | 0.20+ | 0.21+ |

---

## Search

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| ransack | 2.1+ | 2.3+ | 2.4+ | 3.0+ | 4.0+ | 4.0+ | 4.1+ | 4.2+ |
| searchkick | 4.0+ | 4.3+ | 4.6+ | 5.0+ | 5.2+ | 5.2+ | 5.3+ | 5.3+ |
| pg_search | 2.2+ | 2.3+ | 2.3+ | 2.3+ | 2.3+ | 2.3+ | 2.3+ | 2.4+ |

---

## State Machines

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| aasm | 5.0+ | 5.0+ | 5.1+ | 5.2+ | 5.5+ | 5.5+ | 5.5+ | 5.5+ |
| state_machines-activerecord | 0.5+ | 0.6+ | 0.6+ | 0.6+ | 0.9+ | 0.9+ | 0.9+ | 0.9+ |

---

## Other Essential Gems

| Gem | Rails 5.2 | Rails 6.0 | Rails 6.1 | Rails 7.0 | Rails 7.1 | Rails 7.2 | Rails 8.0 | Rails 8.1 |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| simple_form | 4.1+ | 5.0+ | 5.0+ | 5.1+ | 5.2+ | 5.2+ | 5.3+ | 5.3+ |
| draper | 3.1+ | 4.0+ | 4.0+ | 4.0+ | 4.0+ | 4.0+ | 4.0+ | 4.0+ |
| friendly_id | 5.2+ | 5.3+ | 5.4+ | 5.4+ | 5.5+ | 5.5+ | 5.5+ | 5.5+ |
| paranoia | 2.4+ | 2.4+ | 2.5+ | 2.6+ | 2.6+ | 3.0+ | 3.0+ | 3.0+ |
| paper_trail | 10.0+ | 10.3+ | 11.0+ | 12.0+ | 14.0+ | 14.0+ | 15.0+ | 16.0+ |
| geocoder | 1.5+ | 1.6+ | 1.6+ | 1.7+ | 1.8+ | 1.8+ | 1.8+ | 1.9+ |
| chartkick | 3.2+ | 3.4+ | 4.0+ | 4.2+ | 5.0+ | 5.0+ | 5.0+ | 5.1+ |

---

## Attribution

Based on the OmbuLabs.ai / FastRuby.io gem-compatibility reference (MIT licensed), extended to cover Rails 8.0 and 8.1.
