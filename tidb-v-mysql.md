# Which database to start with?

## TiDB Advantages

1. Eliminate need for clickhouse database
2. 100% Mysql compatible (For the current state of the codebase)
3. Super easy cluster management and scale in future.
4. Fast OLAP queries (Automated so devs don't even have to think about them)
5. Redundancy out of the box

## TiDB

1. Expensive resource requirement upfront
2. Cannot see any evidence showing that it's more performant than MySQL for OLTP queries
3. Requires changing all primary keys back to strings (CUID, UUID etc) for distributed primary generation.

## MySQL Advantages

1. Cheaper resource requirements upfront

## MySQL Disadvantages

1. Need to add clickhouse to the stack for analytics queries
2. Cluster management as we grow will require hiring, and we're broke broke.
3. Redundancy at the start will be hard.
