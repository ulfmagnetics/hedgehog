# hedgehog

> "The fox knows many things, but the hedgehog knows one big thing."

This webapp allows users to create webpages that answer simple yes/no questions, such as:

"Is it the Taskmaster's birthday?"

It relies on external sources of truth to determine the answers to these questions.

## Adapter pattern

This app will use an "adapter" pattern to decouple the view logic from
the logic that serves as a source of truth, i.e. that provide a yes/no
answer to the question that users build for each of their pages.

An adapter provides an interface for retrieving an answer to a question
based on some configuration. Adapters can be chained together, so we might
have a `DateAdapter` that evaluates the results from an `ApiAdapter` that
knows how to retrieve data matching certain parameters from an external API,
or an `HTMLAdapter` that might be able to scrape a webpage using a preconfigured
regex to determine an answer.
