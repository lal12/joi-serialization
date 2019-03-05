# JOI Serialization

This lib can serialize and deserialize a JOI Schema into an arbitrary object, which could be saved as JSON e.g. in a Database.

Typescript definitions are included.

It supports all functions documented in the JOI API reference, also nothing is lost during the serialization, with some minor exceptions:

- Currently there is no way to serialize JOI extensions.
- If you use references e.g. `JOI.any().valid(myFunction)` they obviously cannot be serialized.

## Serialization

For serialization the function `serialize` is exported. Just call it with a JOI Schema as parameter.

It is just a wrapper to the JOI function `schema.describe()`, so for serialization purposes, you don't have to install this library. However this might change in the future.

## Deserialization

For deserialization the function `deserialize` is exported. Just pass the serialized JOI Schema (a JOI Schema description) as parameter.

## Installation

`npm install joi-serialization`

## Usage

`const {serialize, deserialize} = require('joi-serialization').`

## Tests

This library is heavily tested and should (while not measured) come near to 100% coverage.

## Implemented

- String
- Bool
- Any
