// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to show the list of all scenarios
 */

import React, { ChangeEventHandler, Component, Fragment } from 'react';

import { RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

/** HTML helper components */
import { ErrorMessage, ErrorMessageWithRetry, ProgressBar } from '../templates/Status';

import {
  LanguageRecord,
  LanguageResourceRecord,
  LanguageResourceValue,
  LanguageResourceValueRecord,
  ScenarioRecord,
} from '@karya/db';

// HoC
import { DataProps, withData } from '../hoc/WithData';

/** Import async ops and action creators */
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';

import { Promise as BBPromise } from 'bluebird';
import exportFromJSON from 'export-from-json';

/** Define Router match params props */
type RouterProps = RouteComponentProps<{}>;

/** Define own props */
type OwnProps = RouterProps;

/** map relevant state to props */
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const resources = state.all.language_resource.data;
  const stringRes = resources.filter((lr) => lr.type === 'string_resource');
  const fileRes = resources.filter((lr) => lr.type === 'file_resource');

  const { data, ...request } = state.all.language_resource_value;
  const { data: ignore, ...langRequest } = state.all.language;

  return {
    stringRes,
    fileRes,
    request,
    langRequest,
  };
};

/** Map dispatch action creators to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
    createLanguageResourceValue: async (lr: LanguageResourceValue) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language_resource_value',
        label: 'CREATE',
        request: lr,
      };
      dispatch(action);
    },
    createFileLanguageResourceValue: async (lr: LanguageResourceValue, file: File) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language_resource_value',
        label: 'FILE_CREATE',
        request: lr,
        files: { file },
      };
      dispatch(action);
    },
    updateLanguageResourceValue: async (id: number, lr: LanguageResourceValue) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language_resource_value',
        label: 'UPDATE_BY_ID',
        id,
        request: lr,
      };
      dispatch(action);
    },
    updateFileLanguageResourceValue: async (id: number, lr: LanguageResourceValue, file: File) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language_resource_value',
        label: 'FILE_UPDATE_BY_ID',
        request: lr,
        id,
        files: { file },
      };
      dispatch(action);
    },
    updateLanguageSupportStatus: async (id: number) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language',
        label: 'UPDATE_SUPPORTED',
        request: {},
        id,
      }
      dispatch(action)
    },
  };
};

/** Create the connector */
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const dataConnector = withData('language', 'scenario', 'language_resource', 'language_resource_value');
const connector = compose(dataConnector, reduxConnector);

/** Language resource list props */
type LanguageResourceValueListProps = OwnProps &
  DataProps<typeof dataConnector> &
  ConnectedProps<typeof reduxConnector>;

/** State for the component */
/** Status of outstanding async requests must go here */
type LanguageResourceValueListState = {
  language_id: number;
  language?: LanguageRecord;
  lrvForm: LanguageResourceValue;
  lrvFile?: File;
  importMessage?: string;
  importError?: string;
};

// String resource value type for import/export
type StringResourceValue = {
  name: string;
  scenario_name: string | null;
  description: string;
  value: string;
  valid: boolean;
  need_update: boolean;
};

type ResourceJSONFile = {
  language: string;
  values: StringResourceValue[];
};

/** LanguageList component */
class LanguageResourceValueList extends Component<LanguageResourceValueListProps, LanguageResourceValueListState> {
  // Set the initial request status to 'SUCCESS'
  state: LanguageResourceValueListState = {
    language_id: 0,
    lrvForm: { value: '' },
  };

  clearLRVForm = () => {
    this.setState({
      lrvForm: { value: '' },
      importError: undefined,
      importMessage: undefined,
    });
  };

  // handle language change
  handleLanguageChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const language_id = Number.parseInt(e.currentTarget.value, 10);
    const language = this.props.language.data.find((l) => l.id === language_id) as LanguageRecord;
    this.setState({ ...this.state, language, language_id });
    this.clearLRVForm();
  };

  // handle click on add resource
  handleAddEditResource = (lrid: number, lrv: LanguageResourceValueRecord | undefined) => {
    const initValues = lrv === undefined ? {} : { id: lrv.id, value: lrv.value };
    const lrvForm: LanguageResourceValue = {
      language_id: this.state.language_id,
      language_resource_id: lrid,
      valid: true,
      need_update: false,
      ...initValues,
    };
    this.setState({ lrvForm });
  };

  // handle change in string input
  handleStringInputChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (e) => {
    const lrvForm: LanguageResourceValue = { ...this.state.lrvForm, value: e.currentTarget.value };
    this.setState({ lrvForm });
  };

  // handle file input change
  handleFileInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.files) {
      this.setState({ lrvFile: e.currentTarget.files[0] });
    }
  };

  // handle create update string resource
  handleCreateUpdateString = () => {
    const { lrvForm } = this.state;
    lrvForm.id
      ? this.props.updateLanguageResourceValue(lrvForm.id, lrvForm)
      : this.props.createLanguageResourceValue(lrvForm);
  };

  // handle create update file resource
  handleCreateUpdateFile = () => {
    const { lrvForm, lrvFile } = this.state;
    lrvForm.id
      ? this.props.updateFileLanguageResourceValue(lrvForm.id, lrvForm, lrvFile as File)
      : this.props.createFileLanguageResourceValue(lrvForm, lrvFile as File);
  };

  // On mount, dispatch actions
  componentDidMount() {
    M.AutoInit();
  }

  /** On update, update materialize fields */
  componentDidUpdate(prevProps: LanguageResourceValueListProps) {
    if (prevProps.request.status === 'IN_FLIGHT' && this.props.request.status === 'SUCCESS') {
      this.clearLRVForm();
    }
    M.updateTextFields();
    M.AutoInit();
  }

  // Function to export string resource values as JSON
  exportStringResourceValues = () => {
    const stringResourceValues: StringResourceValue[] = [];
    const { stringRes } = this.props;
    const lrvs = this.props.language_resource_value.data.filter((v) => v.language_id === this.state.language_id);

    stringRes.forEach((res) => {
      const lrv = lrvs.find((v) => v.language_resource_id === res.id);
      if (lrv) {
        const scenario = this.props.scenario.data.find((s) => s.id === res.scenario_id) as ScenarioRecord;
        stringResourceValues.push({
          scenario_name: res.core ? null : scenario.name,
          name: res.name,
          description: res.description,
          value: lrv.value,
          valid: lrv.valid,
          need_update: lrv.need_update,
        });
      }
    });

    const languageName = (this.state.language as LanguageRecord).name;

    const jsonFile: ResourceJSONFile = {
      language: languageName,
      values: stringResourceValues,
    };

    exportFromJSON({ data: jsonFile, fileName: `${languageName}-string-resources.json`, exportType: 'json' });
  };

  // Function to import string resource values from JSON
  importStringResourceValues = async (srvData: ResourceJSONFile) => {
    const language = this.state.language as LanguageRecord;

    // Check if the language matches
    if (language.name !== srvData.language) {
      this.setState({ importError: 'Failed to import file. Language mismatch' });
      return;
    }

    const lrvs = this.props.language_resource_value.data.filter((lrv) => lrv.language_id === language.id);
    const errors: string[] = [];
    let ignored = 0;
    let overridden = 0;
    let created = 0;

    try {
      await BBPromise.mapSeries(srvData.values, async (srv) => {
        // if srv is invalid, ignore
        if (!srv.valid) {
          ignored += 1;
        }

        // Extract scenario
        let scenario_id: number | null = null;
        if (srv.scenario_name) {
          const scenario = this.props.scenario.data.find((s) => s.name === srv.scenario_name);
          if (!scenario) {
            errors.push(`Invalid scenario '${srv.scenario_name}'`);
            return;
          }
          scenario_id = scenario.id;
        }

        // Extract the LR
        const slr = this.props.stringRes.find((lr) => lr.scenario_id === scenario_id && lr.name === srv.name);
        if (!slr) {
          errors.push(`Language resource not present '${srv.name}'`);
          return;
        }

        const need_update = slr.description !== srv.description;

        // check if the LR has a value and check if the value matches
        const lrv = lrvs.find((v) => v.language_resource_id === slr.id);
        if (lrv) {
          if (lrv.value === srv.value) {
            ignored += 1;
            return;
          } else {
            overridden += 1;
            await this.props.updateLanguageResourceValue(lrv.id, {
              valid: srv.valid,
              need_update: srv.need_update || need_update,
              value: srv.value,
            });
            return;
          }
        }

        // Create a new LRV
        created += 1;
        await this.props.createLanguageResourceValue({
          language_id: language.id,
          language_resource_id: slr.id,
          valid: srv.valid,
          need_update: srv.need_update || need_update,
          value: srv.value,
        });
      });

      this.setState({
        importError: errors.join('. '),
        importMessage: `${ignored} values were ignored; ${overridden} values were overridden; ${created} new values were created;`,
      });
    } catch (e) {
      this.setState({ importError: 'Invalid JSON format' });
      return;
    }
  };

  // Handler for file import
  handleImportSRVClick: ChangeEventHandler<HTMLInputElement> = (e) => {
    // If there are no files return
    if (!e.currentTarget.files) {
      return;
    }

    // Extract the first file
    const file = e.currentTarget.files[0];

    // Create a reader and the handler
    const reader = new FileReader();
    reader.onload = (re) => {
      if (!re.target || !re.target.result) {
        this.setState({ importError: 'Invalid file' });
        return;
      }

      // Process the result
      const data = re.target.result.toString();

      try {
        const srvData: ResourceJSONFile = JSON.parse(data);
        this.importStringResourceValues(srvData);
      } catch (e) {
        this.setState({ importError: 'Invalid JSON file' });
      }
    };

    reader.readAsText(file);
    e.target.value = '';
    e.currentTarget.value = '';
  };

  // method to render a collection-item for a string resource
  renderStringResource = (lr: LanguageResourceRecord) => {
    const lrvs = this.props.language_resource_value.data;
    const { lrvForm } = this.state;

    const language = this.state.language;
    const lrdesc = language ? lr.description.replace('<language>', language.name) : lr.description;

    // This LR is currently begin edited
    if (lrvForm.language_resource_id === lr.id) {
      return (
        <div className='collection-item' key={lr.id}>
          <div className='row valign-wrapper' style={{ marginBottom: '0px' }}>
            <div className='col s2'>{lr.name}</div>
            <div className='col s4'>{lrdesc}</div>
            <div className='col s5 input-field' style={{ margin: '5px' }}>
              <label htmlFor={`${lr.id}`}>String Resource Value</label>
              <textarea
                id={`${lr.id}`}
                className='materialize-textarea'
                value={lrvForm.value}
                onChange={this.handleStringInputChange}
              ></textarea>
            </div>
            <div className='col s1 center-align'>
              <i className='material-icons' style={{ cursor: 'pointer' }} onClick={this.handleCreateUpdateString}>
                send
              </i>
            </div>
          </div>
        </div>
      );
    }

    // Get the lrv for this LR
    const lrv = lrvs.find((v) => v.language_resource_id === lr.id && v.language_id === this.state.language_id);

    // action icon and function
    const actionIcon = lrv === undefined ? 'add' : 'edit';
    const color: string =
      lrv === undefined ? 'red lighten-4' : !lrv.valid || lrv.need_update ? 'orange lighten-4' : 'green lighten-4';

    return (
      <div className={`collection-item ${color}`} key={lr.id}>
        <div className='row valign-wrapper' style={{ marginBottom: '0px' }}>
          {lrv === undefined ? (
            <Fragment>
              <div className='col s2'>{lr.name}</div>
              <div className='col s9 truncate'>{lrdesc}</div>
            </Fragment>
          ) : (
            <Fragment>
              <div className='col s2'>{lr.name}</div>
              <div className='col s4'>{lr.description}</div>
              <div className='col s5'>{lrv.value}</div>
            </Fragment>
          )}
          <div className='col s1 center-align'>
            <i
              className='material-icons'
              style={{ cursor: 'pointer' }}
              onClick={(e) => this.handleAddEditResource(lr.id, lrv)}
            >
              {actionIcon}
            </i>
          </div>
        </div>
      </div>
    );
  };

  // method to render a collection-item for a string resource
  renderFileResource = (lr: LanguageResourceRecord) => {
    const { stringRes } = this.props;
    const lrvs = this.props.language_resource_value.data;
    const { lrvForm } = this.state;

    // Get the lrv for this LR
    const lrv = lrvs.find((v) => v.language_resource_id === lr.id && v.language_id === this.state.language_id);

    // get string lr and lrv
    const stringLR = stringRes.find((stlr) => stlr.id === lr.string_resource_id) as LanguageResourceRecord;
    const stringLRV = lrvs.find(
      (v) => v.language_resource_id === lr.string_resource_id && v.language_id === this.state.language_id,
    );

    // This LR is currently begin edited
    if (lrvForm.language_resource_id === lr.id) {
      return (
        <div className='collection-item' key={lr.id}>
          <div className='row valign-wrapper' style={{ marginBottom: '0px' }}>
            <div className='col s2'>{lr.name}</div>
            <div className='col s2'>{lr.description}</div>
            <div className='col s4'>{stringLRV?.value}</div>
            <div className='col s3  file-field input-field' style={{ margin: '5px' }}>
              <div className='btn btn-small'>
                <i className='material-icons'>attach_file</i>
                <input type='file' name='file' onChange={this.handleFileInputChange} />
              </div>
              <div className='file-path-wrapper'>
                <input type='text' className='file-path validate' />
              </div>
            </div>
            <div className='col s1 center-align'>
              <i className='material-icons' style={{ cursor: 'pointer' }} onClick={this.handleCreateUpdateFile}>
                send
              </i>
            </div>
          </div>
        </div>
      );
    }

    // action icon and function
    const actionIcon = lrv === undefined ? 'add' : 'edit';
    const color: string =
      lrv === undefined ? 'red lighten-4' : !lrv.valid || lrv.need_update ? 'orange lighten-4' : 'green lighten-4';

    return (
      <div className={`collection-item ${color}`} key={lr.id}>
        <div className='row valign-wrapper' style={{ marginBottom: '0px' }}>
          {stringLRV === undefined ? (
            <Fragment>
              <div className='col s2'>{lr.name}</div>
              <div className='col s2'>{lr.description}</div>
              <div className='col s6'>{`This file resource is dependent on the string resource '${stringLR.name}', which is currently not provided. Please specify that resource first.`}</div>
            </Fragment>
          ) : (
            <Fragment>
              {lrv === undefined ? (
                <Fragment>
                  <div className='col s2'>{lr.name}</div>
                  <div className='col s2'>{lr.description}</div>
                  <div className='col s4'>{stringLRV.value}</div>
                  <div className='col s3'></div>
                </Fragment>
              ) : (
                <Fragment>
                  <div className='col s2'>{lr.name}</div>
                  <div className='col s2'>{lr.description}</div>
                  <div className='col s4'>{stringLRV.value}</div>
                  <div className='col s3'>
                    <a href={lrv.value}>Link to current file</a>
                  </div>
                </Fragment>
              )}
              <div className='col s1 center-align'>
                <i
                  className='material-icons'
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => this.handleAddEditResource(lr.id, lrv)}
                >
                  {actionIcon}
                </i>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    );
  };

  render() {
    // Generate error with get languages
    const getLanguagesErrorElement =
      this.props.language.status === 'FAILURE' ? (
        <ErrorMessageWithRetry message={this.props.language.messages} onRetry={this.props.getData('language')} />
      ) : null;

    // Generate error for get resources
    const getLRErrorElement =
      this.props.language_resource.status === 'FAILURE' ? (
        <ErrorMessageWithRetry
          message={this.props.language_resource.messages}
          onRetry={this.props.getData('language_resource')}
        />
      ) : null;

    /** Generate any error message for lrv request */
    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    const languages = this.props.language.data;
    const { language_id } = this.state;
    const languageDropDown = (
      <div className='row lpad20'>
        <div className='input-field col s4'>
          <select id='language_id' value={language_id} onChange={this.handleLanguageChange}>
            <option value={0} disabled={true}>
              Select a Language
            </option>
            {languages.map((l) => (
              <option value={l.id} key={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );

    // Handle all string resources
    const { stringRes } = this.props;
    const stringResourceList = (
      <div className='collection with-header'>
        <div className='collection-header red-text'>
          <h5>String Resources</h5>
        </div>
        {stringRes.map((lr) => this.renderStringResource(lr))}
      </div>
    );

    // Handle all file resources
    const { fileRes } = this.props;
    const fileResourceList = (
      <div className='collection with-header'>
        <div className='collection-header red-text'>
          <h5>File Resources</h5>
        </div>
        {fileRes.map((lr) => this.renderFileResource(lr))}
      </div>
    );

    const { importError, importMessage } = this.state;
    const disableUpdateLanguageSupport = this.props.langRequest.status === 'IN_FLIGHT'

    return (
      <div>
        <div className='z-depth-1 white bmar20'>
          {this.props.language.status === 'FAILURE' ? (
            getLanguagesErrorElement
          ) : this.props.language.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : (
            languageDropDown
          )}
        </div>
        {getLRErrorElement || errorElement ? (
          <div className='section white z-depth-1'>
            {getLRErrorElement}
            {errorElement}
          </div>
        ) : null}
        {language_id === 0 ? null : (
          <Fragment>
            <div className='section'>
              {importError ? (
                <div className='row'>
                  <ErrorMessage message={[importError]} />
                </div>
              ) : null}
              {importMessage ? (
                <div className='row'>
                  <p>{importMessage}</p>
                </div>
              ) : null}
              <div className='row'>
                <div className='col file-field'>
                  <div className='btn'>
                    Import string values from JSON <i className='material-icons right'>arrow_circle_up</i>
                    <input type='file' name='file' onChange={this.handleImportSRVClick} />
                  </div>
                  <div className='file-path-wrapper' hidden={true}>
                    <input type='text' className='file-path validate' />
                  </div>
                </div>
                <div className='col'>
                  <div
                    className='col btn lmar20'
                    style={{ height: '3rem', lineHeight: '3rem' }}
                    onClick={this.exportStringResourceValues}
                  >
                    Export string values as JSON <i className='material-icons right'>arrow_circle_down</i>
                  </div>
                </div>
                <div className='col'>
                  <button
                    className='col btn lmar20'
                    style={{ height: '3rem', lineHeight: '3rem' }}
                    onClick={() => this.props.updateLanguageSupportStatus(language_id)}
                    disabled={disableUpdateLanguageSupport}
                  >
                    Update Language Support Status
                  </button>
                </div>
              </div>
            </div>
            <div id='string-lrs' className='white z-depth-1'>
              {stringResourceList}
            </div>
            <div id='file-lrs' className='white z-depth-1'>
              {fileResourceList}
            </div>
          </Fragment>
        )}
      </div>
    );
  }
}

export default connector(LanguageResourceValueList);
