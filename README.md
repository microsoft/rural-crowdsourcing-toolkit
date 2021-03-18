# Crowdsourcing Toolkit for Low-resource Communities

This repository provides code for a crowdsourcing platform that is specifically
designed to be inclusive of users from low-resource communities. There are two
barriers to inclusion: language and connectivity. Most users in rural
communities in India do not speak/understand English, and many of them do not
have constant and high-speed data connectivity. This platform address these
challenges by 1) providing a fast mechanism to add support for different
languages and 2) using a two-tier server architecture to enable people without
any data connectivity to still participate on the platform.

## Overview of the Platform Architecture

A typical crowdsourcing platform contains two components: a server running in
the cloud and a web/mobile client running in the edge. Work requesters register
with the server and submit new tasks. Workers register directly with the server
to receive new tasks. The server assigns tasks to workers based on the type of
task and the skills of the worker. Unfortunately, this setup requires workers to
have (constant) access to internet.

To break this assumption, this platform uses a two-tier server architecture. The
main server runs in the cloud and interfaces with work requesters to receive new
tasks. The second component, the "box" server can be deployed on a device in the
field and acts a local crowdsourcing server for the specific region. Workers
with a smartphone can directly interact with the box server to receive tasks and
submit their responses. The platform assumes intermittent connectivity between
the box server and the main server during which time they exchange information.
This platform architecture enables two benefits.

1. The box server can still be run as a cloud instance. As a result, if users
   in a region have good connectivity, one can setup a virtual instance of the
   box server for the users and they can participate in the platform seamlessly.

2. If users in a region do not have any connectivity, then the box server can be
   run on a physical device. We have currently experimented running the box
   server on a Raspberry Pi with a 4G dongle. (The codebase needs to be tweaked
   a little to support this setting. We will work on seamless support for this
   mode in subsequent releases.)

## Code Organization

The code is split between three folders: `db-schema`, `server`, and `client`.

The `db-schema` folder contains the specification of the database schema that
will be used across all components of the platform. This component contains
parsers and generators for database initializers, type specification files, and
API related files.

The `server` folder in turn contains three components: `backend` is the main
server built on top of nodejs, `frontend` is a react webapp that allows admins
and work requestors to interact with the main server, and `box` is the box
server built on top of nodejs.

The `client` folder contains the Android app that allows workers to interact
with the platform.

## Setup Instructions

Please see `INSTALL.md` for installation and setup instructions.

## License

We have released this code under the MIT license. Please see `LICENSE.txt` for
details.

## Contributors

Bulk of the initial code base was developed at Microsoft with contributions from
the following people.

- Vivek Seshadri
- Danish Goel
- Pallav Karya
- Mrinal Das
- Anurag Shukla

## Microsoft Open Source Code of Conduct

This project has adopted the Microsoft Open Source Code of Conduct. Please visit
[Code of Conduct](https://opensource.microsoft.com/codeofconduct) for more
information or email opencode@microsoft.com with your queries.
