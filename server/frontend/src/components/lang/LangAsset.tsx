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
    submitLangAsset: (la: { file: File; code: LanguageCode }) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'karya_file',
        label: 'CREATE',
        request: la,
      };
      dispatch(action);
    },

    // To get language asset files
    getLangAssets: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'karya_file',
        label: 'GET_ALL',
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
  langAsset?: { file: File; code: LanguageCode };
  show_form?: boolean;
};

// Task list component
class LangAsset extends React.Component<LangAssetProps, LangAssetState> {
  // Initial state
  state: LangAssetState = {};

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
      const langAsset = { file: file, code: e.currentTarget.id as LanguageCode };
      this.setState({ langAsset });
    }
  };

  // Submit file
  submitLangAsset = () => {
    this.state.langAsset !== undefined
      ? this.props.submitLangAsset(this.state.langAsset)
      : this.setState({ show_form: true });
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
    const langRows: langInfo[] = Object.keys(languageMap).map((c) => {
      return { ...languageMap[c as LanguageCode], code: c as LanguageCode };
    });

    // File submitted previously
    const submittedFile = (li: langInfo) => {
      const file = files.find((f) => f.name === `${li.code}.tgz`);
      return (
        <>
          {file !== undefined ? (
            <a href={file.extras.url} download>
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
          <button className='btn-flat' id='submit-lang-btn' onClick={() => this.setState({ show_form: true })}>
            <i className='material-icons left'>add</i>Submit file
          </button>
          <div id='submit-lang-form' style={{ display: this.state.show_form === true ? 'block' : 'none' }}>
            <div className='row'>
              <p>
                <i></i>
              </p>
              <div className='col s12 file-field input-field'>
                <div className='btn btn-small'>
                  <i className='material-icons'>attach_file</i>
                  <input type='file' id={li.code} onChange={this.handleFileChange} />
                </div>
                <div className='file-path-wrapper'>
                  <label htmlFor='tgz-name'>TGZ File</label>
                  <input id='tgz-name' type='text' disabled={true} className='file-path validate' />
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
            </>
          )}
        </div>
      </div>
    );
  }
}

export default connector(LangAsset);
