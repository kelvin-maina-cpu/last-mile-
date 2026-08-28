# Last Mile

A last-mile delivery coordination platform connecting retailers, dispatchers, and riders in real time.

## What this is

Retailers create deliveries, dispatchers assign them to riders, and riders update delivery status as they move through pickup, transit, and drop-off. Retailer, dispatcher, and rider all see status changes as they happen.

## Project structure

    last-mile-/
        |-- backend/          API server, business logic, data layer (owner: Kelvin)
            |-- frontend/         Retailer + dispatcher + rider web app (owners: Mercyline, Mary)
                |-- docs/
                    |   |-- architecture.md     System design, components, data flow
                        |   |-- decisions.md        Architecture decision log (ADRs)
                            |   |-- api-contract.md     REST API contract
                                |   |-- trade-offs.md       Trade-off log kept during the build
                                    |   |-- testing.md          Test strategy and evidence
                                        |   `-- demo-script.md      Final demo walkthrough
                                            |-- presentation/     Slides, trade-off log, demo script, timing notes
                                                `-- README.md

                                                ## Team

                                                | Area | Owner |
                                                |---|---|
                                                | Architecture / coordination | Kelvin |
                                                | Backend | Kelvin |
                                                | Frontend | Mercyline |
                                                | Data | Jacob |
                                                | Rider experience | Mary |
                                                | QA | Bbossa |

                                                ## Getting started

                                                Start with [`docs/architecture.md`](docs/architecture.md) for the system overview and [`docs/api-contract.md`](docs/api-contract.md) for the API surface. Backend and frontend setup instructions will land in their own folders as those tracks come online.

                                                ## Status

                                                Project scaffolding just went up — see the GitHub Project board for live task status.
                                                
