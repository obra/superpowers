# Complete implementation of condition-based waiting utilities
# Adapted from: test infrastructure improvements (2025-10-03)
# Context: Fixed 15 flaky tests by replacing arbitrary sleeps

require "timeout"

module ConditionWaiting
  # Wait for a condition block to return a truthy value.
  #
  # @param description [String] human-readable label for timeout errors
  # @param timeout [Numeric] seconds before raising (default 5)
  # @param interval [Numeric] polling interval in seconds (default 0.01)
  # @yield condition to evaluate; return truthy to stop waiting
  # @return the truthy value returned by the block
  # @raise [RuntimeError] if timeout expires
  def wait_for(description: "condition", timeout: 5, interval: 0.01)
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + timeout
    loop do
      result = yield
      return result if result
      if Process.clock_gettime(Process::CLOCK_MONOTONIC) > deadline
        raise "Timeout after #{timeout}s waiting for: #{description}"
      end
      sleep interval
    end
  end

  # Wait for a specific event type to appear in a thread or queue.
  #
  # @param source [#events] object that responds to #events returning an array
  # @param event_type [Symbol, String] event type to wait for
  # @param timeout [Numeric] seconds before raising
  # @return [Hash] the matching event
  def wait_for_event(source, event_type, timeout: 5)
    wait_for(description: "event :#{event_type}", timeout: timeout) do
      source.events.find { |e| e[:type] == event_type }
    end
  end

  # Wait until at least +count+ events of +event_type+ have been emitted.
  #
  # @param source [#events] object that responds to #events
  # @param event_type [Symbol, String] event type to count
  # @param count [Integer] minimum required count
  # @param timeout [Numeric] seconds before raising
  # @return [Array<Hash>] all matching events once count is reached
  def wait_for_event_count(source, event_type, count:, timeout: 5)
    wait_for(
      description: "#{count}x event :#{event_type}",
      timeout: timeout
    ) do
      matches = source.events.select { |e| e[:type] == event_type }
      matches if matches.length >= count
    end
  end

  # Wait for an event matching both type and predicate.
  #
  # @param source [#events] object that responds to #events
  # @param event_type [Symbol, String] event type to match
  # @param timeout [Numeric] seconds before raising
  # @yield [event] additional predicate; return truthy to accept the event
  # @return [Hash] the first matching event
  def wait_for_event_match(source, event_type, timeout: 5, &predicate)
    wait_for(
      description: "event :#{event_type} matching predicate",
      timeout: timeout
    ) do
      source.events.find { |e| e[:type] == event_type && predicate.call(e) }
    end
  end
end
