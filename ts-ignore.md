## backend/src/controllers/BoxRequestController.ts
Sno | Line | Reason
|---|------|-------|
1 | [Line 108](.\server\backend\src\controllers\BoxRequestController.ts#L108) | Property 'path' does not exist on type 'File \| File[]'.
2 | [Line 133](.\server\backend\src\controllers\BoxRequestController.ts#L133) | Property 'path' does not exist on type 'File \| File[]'.

## backend/src/controllers/LanguageResourceValue.extra.ts
Sno | Line | Reason
|---|------|-------|
1 | [Line 39](.\server\backend\src\controllers\LanguageResourceValue.extra.ts#L39) | Type 'string \| string[]' is not assignable to type 'number \| undefined'.
2 | [Line 47](.\server\backend\src\controllers\LanguageResourceValue.extra.ts#L47) | Type 'string \| string[] \| undefined' is not assignable to type 'undefined'.
3 | [Line 105](.\server\backend\src\controllers\LanguageResourceValue.extra.ts#L105) | Property 'name' does not exist on type 'File \| File[]'.
4 | [Line 124](.\server\backend\src\controllers\LanguageResourceValue.extra.ts#L124) | Property 'name' does not exist on type 'File \| File[]'.
5 | [Line 164](.\server\backend\src\controllers\LanguageResourceValue.extra.ts#L164) | Property 'name' does not exist on type 'File \| File[]'.
6 | [Line 192](.\server\backend\src\controllers\LanguageResourceValue.extra.ts#L192) | Property 'name' does not exist on type 'File \| File[]'.
## Backend/Src/Controllers/Microtask.extra.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 67](.\server\backend\src\controllers\Microtask.extra.ts#L67) | Type 'string \| string[]' is not assignable to type 'number \| undefined'.
2 | [Line 72](.\server\backend\src\controllers\Microtask.extra.ts#L72) | Type 'string \| string[]' is not assignable to type 'number \| null \| undefined'.
3 | [Line 115](.\server\backend\src\controllers\Microtask.extra.ts#L115) | Type 'string \| string[] \| undefined' is not assignable to type 'undefined'.

## Backend/Src/Controllers/MicrotaskAssignment.extra.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 33](.\server\backend\src\controllers\MicrotaskAssignment.extra.ts#L33) | Type 'string \| string[] \| undefined' is not assignable to type 'undefined'.
2 | [Line 37](.\server\backend\src\controllers\MicrotaskAssignment.extra.ts#L37) | Type 'string \| string[] \| undefined' is not assignable to type 'number'.

## Backend/Src/Controllers/MicrotaskGroup.extra.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 68](.\server\backend\src\controllers\MicrotaskGroup.extra.ts#L68) | Type 'string \| string[]' is not assignable to type 'number \| undefined'.

## Backend/Src/Controllers/PaymentRequest.extra.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 32](.\server\backend\src\controllers\PaymentRequest.extra.ts#L32) | Type 'string \| string[]' is not assignable to type 'number \| undefined'.

## Backend/Src/Controllers/ScenarioLanguageSupport.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 24](.\server\backend\src\controllers\ScenarioLanguageSupport.ts#L24) | Type 'string \| string[] \| undefined' is not assignable to type 'undefined'.

## Backend/Src/Controllers/Task.extra.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 42](.\server\backend\src\controllers\Task.extra.ts#L42) | Type 'string \| string[]' is not assignable to type 'number \| undefined'.

## Backend/Src/Models/BoxRequestModel.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 68](.\server\backend\src\models\BoxRequestModel.ts#L68) | Type '(BoxRecord \| LanguageResourceRecord \| LanguageRecord \| WorkerRecord \| KaryaFileRecord \| ... 13 more ... \| PayoutMethodRecord)[]' is not assignable to type 'WorkerRecord[] & KaryaFileRecord[] & TaskAssignmentRecord[] & WorkerLanguageSkillRecord[] & MicrotaskGroupAssignmentRecord[] & ... 13 more ... & PayoutMethodRecord[]'.
2 | [Line 138](.\server\backend\src\models\BoxRequestModel.ts#L138) | Property 'toISOString' does not exist on type 'string'.
3 | [Line 155](.\server\backend\src\models\BoxRequestModel.ts#L155) | Type '(WorkerRecord \| KaryaFileRecord \| TaskAssignmentRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord \| PayoutInfoRecord \| PaymentRequestRecord)[]' is not assignable to type 'WorkerRecord[] & KaryaFileRecord[] & TaskAssignmentRecord[] & WorkerLanguageSkillRecord[] & MicrotaskGroupAssignmentRecord[] & MicrotaskAssignmentRecord[] & PayoutInfoRecord[] & PaymentRequestRecord[]'.
4 | [Line 210](.\server\backend\src\models\BoxRequestModel.ts#L210) | Argument of type 'WorkerRecord \| KaryaFileRecord \| TaskAssignmentRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord \| PayoutInfoRecord \| PaymentRequestRecord' is not assignable to parameter of type 'MicrotaskAssignmentRecord'.
5 | [Line 227](.\server\backend\src\models\BoxRequestModel.ts#L227) | Argument of type 'WorkerRecord \| KaryaFileRecord \| TaskAssignmentRecord \| WorkerLanguageSkillRecord \| `MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord` \| PayoutInfoRecord \| PaymentRequestRecord' is not assignable to parameter of type 'WorkerRecord \| KaryaFileRecord \| TaskAssignmentRecord \| WorkerLanguageSkillRecord \| `MicrotaskGroupAssignmentRecord` \| PayoutInfoRecord \| PaymentRequestRecord'.

## Backend/Src/Routes/Middlewares.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 57](.\server\backend\src\routes\Middlewares.ts#L57) | Type 'string \| string[]' is not assignable to type 'AuthProviderType'.
2 | [Line 59](.\server\backend\src\routes\Middlewares.ts#L59) | Type 'string \| string[] \| undefined' is not assignable to type 'string'.
3 | [Line 126](.\server\backend\src\routes\Middlewares.ts#L126) | Type 'string \| string[]' is not assignable to type 'number \| undefined'.

## backend\src\scenarios\common\ParameterParser.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 121](.\server\backend\src\scenarios\common\ParameterParser.ts#L121) | Type 'File \| File[]' is not assignable to type 'File'.

## backend\src\scenarios\speech-data\Index.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 83](.\server\backend\src\scenarios\speech-data\Index.ts#L83) | Element implicitly has an 'any' type because expression of type '"files"' can't be used to index type '{}'.
2 | [Line 206](.\server\backend\src\scenarios\speech-data\Index.ts#L206) | Property 'files' does not exist on type 'object'.
3 | [Line 211](.\server\backend\src\scenarios\speech-data\Index.ts#L211) | Property 'data' does not exist on type 'object'.
4 | [Line 215](.\server\backend\src\scenarios\speech-data\Index.ts#L215) | Property 'report' does not exist on type 'object'.

## backend\src\scenarios\speech-verification\Index.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 85](.\server\backend\src\scenarios\speech-verification\Index.ts#L85) | Property 'assignment' does not exist on type '{}'.
2 | [Line 114](.\server\backend\src\scenarios\speech-verification\Index.ts#L114) | Property 'data' does not exist on type 'object'.

## server\box\src\auth-providers\phone-otp\Index.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 26](.\server\box\src\auth-providers\phone-otp\Index.ts#L26) | Property 'phone_number' does not exist on type 'object'.


## server\box\src\controllers\FileLanguageResourceValueController.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 27](.\server\box\src\controllers\FileLanguageResourceValueController.ts#L27) | Type 'string \| string[]' is not assignable to type 'number'.
2 | [Line 34](.\server\box\src\controllers\FileLanguageResourceValueController.ts#L34) | Type 'string \| string[]' is not assignable to type 'number'.

## server\box\src\controllers\KaryaFileController.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 125](.\server\box\src\controllers\KaryaFileController.ts#L125) | Property 'path' does not exist on type 'File \| File[]'.

## server\box\src\cron\SendUpdatesToServer.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 42](.\server\box\src\cron\SendUpdatesToServer.ts#L42) | Type '(WorkerRecord \| KaryaFileRecord \| TaskAssignmentRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord \| PayoutInfoRecord \| PaymentRequestRecord)[]' is not assignable to type 'WorkerRecord[] & KaryaFileRecord[] & TaskAssignmentRecord[] & WorkerLanguageSkillRecord[] & MicrotaskGroupAssignmentRecord[] & MicrotaskAssignmentRecord[] & PayoutInfoRecord[] & PaymentRequestRecord[]'.
2 | [Line 34](.\server\box\src\cron\SendUpdatesToServer.ts#L34) | Type '(WorkerRecord \| KaryaFileRecord \| TaskAssignmentRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord \| PayoutInfoRecord \| PaymentRequestRecord)[]' is not assignable to type 'WorkerRecord[] & KaryaFileRecord[] & TaskAssignmentRecord[] & WorkerLanguageSkillRecord[] & MicrotaskGroupAssignmentRecord[] & MicrotaskAssignmentRecord[] & PayoutInfoRecord[] & PaymentRequestRecord[]'.

## box\src\models\DbUpdatesModel.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 74](.\server\box\src\models\DbUpdatesModel.ts#L74) | Type '(WorkerRecord \| LanguageResourceRecord \| LanguageRecord \| ScenarioRecord \| LanguageResourceValueRecord \| ... 12 more ... \| PaymentRequestRecord)[]' is not assignable to type 'LanguageRecord[] & ScenarioRecord[] & LanguageResourceRecord[] & LanguageResourceValueRecord[] & ... 13 more ... & PaymentRequestRecord[]'
2 | [Line 234](.\server\box\src\models\DbUpdatesModel.ts#L234) | Property 'worker_id' does not exist on type 'WorkerRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord'.
3 | [Line 258](.\server\box\src\models\DbUpdatesModel.ts#L258) | Argument of type 'WorkerRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord' is not assignable to parameter of type 'MicrotaskAssignmentRecord'.
4 | [Line 260](.\server\box\src\models\DbUpdatesModel.ts#L260) | Argument of type 'WorkerRecord \| WorkerLanguageSkillRecord \| MicrotaskGroupAssignmentRecord \| MicrotaskAssignmentRecord' is not assignable to parameter of type 'MicrotaskGroupAssignmentRecord'.


## server\box\src\routes\Middlewares.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 64](.\server\box\src\routes\Middlewares.ts#L64) | Type 'string \| string[]' is not assignable to type 'AuthProviderType'.
2 | [Line 66](.\server\box\src\routes\Middlewares.ts#L66) | Type 'string \| string[] \| undefined' is not assignable to type 'string'.

## db-schema\src\parsers\TableParser.ts

Sno | Line | Reason
|---|------|-------|
1 | [Line 64](.\server\db-schema\src\parsers\TableParser.ts#L64) | Type 'string \| undefined' is not assignable to type 'string'.
2 | [Line 66](.\server\db-schema\src\parsers\TableParser.ts#L66) | Type 'string \| undefined' is not assignable to type 'string'.
3 | [Line 71](.\server\db-schema\src\parsers\TableParser.ts#L71) | Type 'string \| undefined' is not assignable to type 'string'.
4 | [Line 88](.\server\db-schema\src\parsers\TableParser.ts#L88) | Type 'string[]' is not assignable to type '("unique" \| "not null" \| "pk" \| "now" \| "false" \| "true" \| "eon" \| "empty" \| "filter")[]'.

## frontend\src\components\hoc\WithData.tsx

Sno | Line | Reason
|---|------|-------|
1 | [Line 42](.\server\frontend\src\components\hoc\WithData.tsx#L42) | Type '{}' is not assignable to type 'Pick<AllState, Table>'.
2 | [Line 64](.\server\frontend\src\components\hoc\WithData.tsx#L64) | Typec'ConnectedComponent<ComponentType<Matching<Pick<AllState, Table> & { getData: (table: Table) => (params?: {} \| DbParamsType<Table\>) => any; }ClassAttributes<DataWrapper> & Pick<...> & { ...; }>>

## frontend\src\components\hoc\WithData.tsx

Sno | Line | Reason
|---|------|-------|
1 | [Line 30](.\server\frontend\src\components\hoc\WithData.tsx#L30) | Argument of type 'number' is not assignable to parameter of type 'string'.