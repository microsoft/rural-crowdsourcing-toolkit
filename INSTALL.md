# Platform Installation Instructions

In this document, we will describe a basic setup and installation of the
platform. You can setup and try out the platform on a single machine and a
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
   currently used 2factor.in APIs.

## Server Backend

---

### 1. Install the necessary npm packages.

`# backend> npm install`

### 2. Setup the config file

Create a database for the backend server. Update the config file
`config/Local.ts` with the database, blobstore, and google client ID
information. You can update the other config parameters as well. Ensure that
`config/Index.ts` points to the right config. You can create your own additional
config files.

### 3. Compile the package

`# backend> npx tsc`

### 4. Reset the database

`# backend> node dist/scripts/ResetDB.js`

This command resets the database, initializes some tables with sample values,
and also bootstraps authentication. Any one who wants to sign up on the platform
(admin / work provider) needs an access code. This script sets up a admin record
and spits out the access code for the admin to sign up.

### 5. Start the server

`# backend> node dist/Server.js`

## Server Frontend

---

### 1. Install the necessary npm packages.

`# frontend> npm install`

### 2. Setup the config file

Set up the config file to match the server parameters (port, oauth client ID.)

### 3. Run the frontend server

`# frontend> npm start`

### 4. Sign up admin user

Open the frontend server URL on a browser. Sign up using the admin access code
that you received from the backend `ResetDB.js` script.

### 5. Setup English language support

Go to the "Language Support" tag, and add support for English by uploading the
`backend/scripts/English-string-resources.json` file. Update language support
status for English by clicking on the button.

You can add new languages and also add support for new languages through this
interface.

### 6. Generate access codes for work provider (optional)

Click on the "Work Providers" tab and generate an access code for a work
provider. This step is optional for the test setup as you can do all activities
as an admin.

### 7. Create a new box

Click on the "Box" tab and generate an access code for a new box.

## Box Server

---

### 1. Install the necessary npm packages.

`# box> npm install`

### 2. Setup the config file

Setup the config file `config/Local.ts`. If for the test setup the box and the server are running
on the same machine, then the box database name should be different from the
server database name.

### 3. Update the box details

Open `config/BoxInfo.ts` and update the details of the box. For creation_code,
use the access code generated in Step 6 of the frontend setup.

### 4. Compile the package

`# box> npx tsc`

### 5. Reset the database

`# box> node dist/scripts/ResetDB.js`

### 6. Register the box

`# box> node dist/scripts/RegisterBox.js`

This step will also update the box_id.ts with the ID of the box obtained from
the server. Therefore, you need to recompile the package once.

`# box> npx tsc`

### 7. Start the box server

`# box> node dist/Server.js`

### 8. Start the cron job for periodic interaction with the main server

`# box> node dist/cron/Cron.js`

### 9. Generate access codes for workers

`# box> node dist/scripts/GenerateCCs.js <n>`

The above script will generate `n` access codes to be used by workers when they
register on the platform.

## Create Your First Task

---

### 1. Sign into the frontend

You can do this as a work provider or as an admin.

### 2. Create a new task

On the "Tasks" tab, click "Create Task". Choose the "Speech Data Collection"
scenario. Choose "English" language. Fill out some test details for the name and
description. Use the following information for the remaining fields and Submit Task.

Instruction: "Please record yourself speaking out this sentence"

Sentence File: Upload the file `backend/sample/speech-data-sample-english.json`.

Number of Recordings: 10

Credits per Recording: 1

Include Verification: False

### 3. Validate the task

Go to task details from the "Tasks" tab and validate the newly submitted task.

### 4. Approve the task (must be done as admin)

Go to task details from the "Tasks" tab and approve the validated task.

### 5. Assign task to box (must be done as admin)

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

### 3. Register with the app choosing English as the language
