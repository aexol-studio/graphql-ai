# GraphQL AI

GraphQL AI is a self hosted backend that allows you to use all the AI models within one SDK backend that is written in NodeJS and GraphQL.

## Why?

The reason why I created this is to write AI applications in code.

## How to start?

Clone the repo. Run the docker file ( soon )

Your GraphQL Server should be running on http://localhost:4000/graphql

Enter the server.

Then you need to create your GraphQL AI API key. You can do this with the following GraphQL Mutation in GraphiQL:

```graphql
mutation generateAPIKey($generateAPIKey_key: CreateAPIKey!) {
  generateAPIKey(key: $generateAPIKey_key)
}
```

```json
{
  "query": "mutation generateAPIKey($generateAPIKey_key: CreateAPIKey!) { generateAPIKey(key: $generateAPIKey_key) }",
  "variables": {
    "generateAPIKey_key": {
      "name": "CardGame",
      "openAiKey": "MY_OPEN_AI_KEY",
      "replicateKey": "MY_REPLICATE_KEY"
    }
  }
}
```

You should receive the following response:

```json
{
  "generateAPIKey": "YOUR_API_KEY"
}
```

Now you can use this API Key to communicate with GraphQL AI models by adding the **Key** header with your **YOUR_API_KEY** value. For example

```json
{
  "Key": "YOUR_API_KEY"
}
```

So to get the full response ( not-streamed ) from Chat GPT 3.5 you can use this query:

```gql
query JustConversationWithGpt($chatGPT35Turbo_input: GPT35_Input!) {
  ai {
    conversational {
      chatGPT35Turbo(input: $chatGPT35Turbo_input) {
        message {
          content
          role
        }
      }
    }
  }
}
```

with variables:

```json
{
  "chatGPT35Turbo_input": {
    "messages": [
      {
        "content": "Hello Chat!",
        "role": "user"
      }
    ]
  }
}
```

## Start locally

If you wanna start up graphql-ai locally you can use our prepared docker compose recipe. To run project, enter this command:

```sh
docker-compose -f docker/docker-compose.yaml up -d --build
```

## Features:

- connected to OpenAI
- connected to replicate
- many image models
- llama model
- GPT models
- create assistants
- create assistant networks

Just remember it is your own proxy to many models. You need to have accounts and api keys.

## Roadmap in progress

- [ ] ability to self host with docker compose
- [ ] frontend playground for everything included in docker compose
- [ ] desktop app for lazy people that runs everything underneath
