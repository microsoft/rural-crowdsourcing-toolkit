# Platform Installation Instructions

In this document, we will describe a basic setup and installation of the
platform. You can setup and try out the platform using a single machine and a
smartphone.

## Prerequisites

---

You need to install and setup the following applications before setting up the
backend server.

1. **Postgresql Server** (version 12 or above) - Postgres drives our main database.
2. **Redis Server** - Needed for bull library. We are working on removing this
   requirement
3. **Azure blobstore** - You need to provide the account name and key as part of the
   configuration
4. **Google OpenID Client ID** - This is needed for authenticating work
   providers and admins with the server.
5. **OTP Provider** - If you need to send OTP for authentication. The codebase
   currently uses 2factor.in APIs.
6. **Keycloak** - Karya uses Keycloak for role management at server side. You can download it from [here](https://www.keycloak.org/downloads) (Download the distribution provided by WildFly).

## Common Server Setup

---

We have converted the codebase into a monorepo to enable effective sharing of
modules between different server components. We currently use `lerna` to manage
dependencies and compilation.

### 1. Install `lerna` and other necessary packages.

`# > npm install`

### 2. Setup all the modules and their dependencies.

`# > npx lerna bootstrap`

This step must be run whenever there is an update to any of the package.json
files.

### 3. Compile the server modules

`# > npx lerna run compile`

You can also use the following command to clean build.

`# > npx lerna run build`

## Keycloak setup

### 1. Start the Keycloak server

After downloading and unpacking the ZIP | tar.gz from the keycloack official website, run standalone.sh inside the bin folder under the root Keycloak folder. Make sure you have JAVA installed.

`# keycloak-16.1.0> bin/standalone.sh`

### 2. Creating the admin account

1. Before you can use Keycloak, you need to create an admin account which you use to log in to the Keycloak admin console.

2. Open http://localhost:8080/auth in your web browser. The welcome page opens, confirming that the server is running.
3. Enter a username and password to create an initial admin user.

### 3. Update `.env` file in backend

Paste the username and password in KEYCLOAK_USERNAME and KEYCLOAK_PASSWORD in .env file for the backend server. (More on how to setup `.env` file in following section)

## Server Backend

---

### 1. Setup the config

Create a postgres database for the backend server. Copy the `.sample.env` file
in the backend folder to `.env`. Fill out all the fields in the `.env` file.

### 2. Reset the database

`# backend> node dist/scripts/ResetDB.js`

This command resets the database and bootstraps authentication. Any one who
wants to sign up on the platform (admin / work provider) needs an access code.
This script sets up a admin record and spits out the access code for the admin
to sign up.

### 3. Start the redis-server

`# > sudo service redis-server start`

### 4. Start the server

`# backend> node dist/Server.js`

## Server Frontend

---

### 1. Setup the config file

Copy the `.sample.env` file to `.env` and fill out the fields.

### 2. Run the frontend server

`# frontend> npm start`

### 3. Sign up admin user

Open the frontend server URL on a browser. Sign up using the admin access code
that you received from the backend `ResetDB.js` script.

### 4. Generate access codes for work provider (optional)

Click on the "Work Providers" tab and generate an access code for a work
provider. This step is optional for the test setup as you can do all activities
as an admin.

### 5. Create a new box

Click on the "Box" tab and generate an access code for a new box.

## Box Server

---

### 1. Setup the config file

Copy the `.sample.env` file to `.env` and fill out the fields. If for the test
setup the box and the server are running on the same machine, then the box
database name should be different from the server database name.

### 2. Setup box-specific config

Copy the `.sample.box` file to another file (say `.box`) and fill out the
details of the box.

### 3. Reset the database

`# box> node dist/scripts/ResetDB.js`

### 4. Register the box

`# box> node dist/scripts/RegisterBox.js .box`

The argument to this script should be the filepath to the box-specific config
file.

### 5. Start the box server

`# box> node dist/Server.js`

### 6. Start the cron job for periodic interaction with the main server

`# box> node dist/cron/Cron.js`

### 9. Generate access codes for workers

`# box> node dist/scripts/GenerateWorkerCodes.js -h`

This script will generate access codes for workers. The above command will list
the command line argument to the script.

## Create Your First Task

---

### 1. Sign into the frontend

You can do this as a work provider or as an admin.

### 2. Create a new task

On the "Tasks" tab, click "Create Task". Choose the "Speech Data Collection"
scenario. Choose "English" language. Fill out some test details for the name and
description. Use the following information for the remaining fields and Submit Task.

### 3. Add input files

Go to the task detail page of the newly created task. Under input files, you can
add a new input file for this task. You can use the sample task json file in the
`samples` folder.

### 4. Assign task to box (must be done as admin)

Go to "Task Assignment" and assign the newly created task to the box.

Number of Recordings: 10

Once the task is assigned to the box, the box will receive it the next time the
sync cron job runs (the one started in Step 7 of the box setup).

## Client

---

### 1. Update the box server url

Update the box server URL in `<package>/networking/RetrofitFactory.kt` to the
address of your box. For local testing, it should just be the IP address (with
port number) of the your box.

### 2. Build and install the apk on your phone/emulator
