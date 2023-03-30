// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to enable uploading of language asset file
 */

// React stuff
import * as React from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import { languageMap, LanguageCode, LanguageInterface, KaryaFileRecord } from '@karya/core';

import { BackendRequestInitAction } from '../../store/apis/APIs';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// CSS
import '../../css/lang/LangAsset.css';

// Map state to props
const mapStateToProps = (state: RootState) => {
  const { data, ...request } = state.all.karya_file;
  return {
    files: data,
    request,
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    // To submit language asset
    submitLangAsset: (code: LanguageCode, file: File) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'karya_file',
        label: 'CREATE_LANGUAGE_ASSET',
        code,
        request: {},
        files: { file },
      };
      dispatch(action);
    },

    // To get language asset files
    getLangAssets: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'karya_file',
        label: 'GET_LANGUAGE_ASSETS',
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(reduxConnector);

type LangAssetProps = ConnectedProps<typeof reduxConnector>;

// component state
type LangAssetState = {
  show_form: boolean;
  code?: LanguageCode;
  file?: File;
};

// Task list component
class LangAsset extends React.Component<LangAssetProps, LangAssetState> {
  // Initial state
  state: LangAssetState = { show_form: false };

  componentDidMount() {
    this.props.getLangAssets();
    M.AutoInit();
  }

  componentDidUpdate() {
    M.AutoInit();
  }

  // Handle file change
  handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.files) {
      const file = e.currentTarget.files[0];
      this.setState({ file });
    }
  };

  // Submit file
  submitLangAsset = () => {
    const { code, file } = this.state;
    if (!code || !file) return;
    this.props.submitLangAsset(code, file);
    this.setState({ show_form: false });
  };

  // Render component
  render() {
    // Create error message element if necessary
    const getErrorElement =
      this.props.request.status === 'FAILURE' ? (
        <ErrorMessageWithRetry message={['Unable to fetch the data']} onRetry={this.props.getLangAssets} />
      ) : null;

    type Extras = { url: string };
    const files = this.props.files as (KaryaFileRecord & { extras: Extras })[];

    type langInfo = LanguageInterface & { code: LanguageCode };
    const langRows: langInfo[] = Object.entries(languageMap).map(([code, values]) => {
      return { code: code as LanguageCode, ...values };
    });

    // File submitted previously
    const submittedFile = (li: langInfo) => {
      const file = files.find((f) => f.name === `${li.code}.tgz`);
      return (
        <>
          {file && file.url ? (
            <a href={file.url} download>
              <span>{file.name}</span>
            </a>
          ) : (
            <span>None</span>
          )}
        </>
      );
    };

    // File upload button and form
    const fileUpload = (li: langInfo) => {
      return (
        <>
          <button
            className='btn-flat'
            id='submit-lang-btn'
            onClick={() => this.setState({ show_form: true, code: li.code })}
          >
            <i className='material-icons left'>add</i>Submit file
          </button>
        </>
      );
    };

    // List of columns to be displayed
    const tableColumns: Array<TableColumnType<langInfo>> = [
      { header: 'Name', type: 'field', field: 'name' },
      { header: 'Primary Name', type: 'field', field: 'primary_name' },
      { header: 'File', type: 'function', function: submittedFile },
      { header: '', type: 'function', function: fileUpload },
    ];

    return (
      <div className='row main-row'>
        <div className='col s12'>
          {this.props.request.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : this.props.request.status === 'FAILURE' ? (
            { getErrorElement }
          ) : (
            <>
              <h1 className='page-title' id='lang-title'>
                Language Assets
              </h1>
              <div className='basic-table' id='lang-asset-table'>
                <TableList<langInfo>
                  columns={tableColumns}
                  rows={langRows}
                  emptyMessage='There are no language assets'
                />
              </div>
              <div id='submit-lang-form' style={{ display: this.state.show_form === true ? 'block' : 'none' }}>
                <div className='row'>
                  <p>Upload language asset file for {this.state.code}</p>
                  <div className='col s12 file-field input-field'>
                    <div className='btn btn-small'>
                      <i className='material-icons'>attach_file</i>
                      <input type='file' id={this.state.code} onChange={this.handleFileChange} />
                    </div>
                    <div className='file-path-wrapper'>
                      <label htmlFor={`${this.state.code}-tgz-name`}>TGZ File</label>
                      <input
                        id={`${this.state.code}-tgz-name`}
                        type='text'
                        disabled={true}
                        className='file-path validate'
                      />
                    </div>
                  </div>
                </div>
                <div className='row' id='btn-row2'>
                  <button className='btn' id='upload-btn' onClick={this.submitLangAsset}>
                    Upload
                    <i className='material-icons right'>upload</i>
                  </button>
                  <button className='btn cancel-btn' onClick={() => this.setState({ show_form: false })}>
                    Cancel
                    <i className='material-icons right'>close</i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default connector(LangAsset);
