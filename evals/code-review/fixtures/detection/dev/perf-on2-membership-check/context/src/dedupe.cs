// src/dedupe.cs — deduplicate items by Id while preserving order.
//
// `Item` is a value type with thousands of unique IDs in typical input.
// The change replaces a HashSet<string> with a List<string>, making the
// membership check O(n) per item ⇒ overall O(n²).

using System.Collections.Generic;

namespace MyApp;

public sealed record Item(string Id, string Body);

public static class Dedupe
{
    public static List<Item> Unique(IEnumerable<Item> items)
    {
        // CHANGED in this PR: was HashSet<string>, now List<string>.
        var seen = new List<string>();
        var result = new List<Item>();
        foreach (var item in items)
        {
            if (!seen.Contains(item.Id))
            {
                seen.Add(item.Id);
                result.Add(item);
            }
        }
        return result;
    }
}
