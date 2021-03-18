// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of languages in the system. The component also
 * provides an action button to create a new language and edit buttons to update
 * existing languages.
 */

// React stuff
import React from 'react';
import { Link } from 'react-router-dom';

// Redux stuff
import { compose } from 'redux';

import { AuthProps, withAuth } from '../hoc/WithAuth';
import { DataProps, withData } from '../hoc/WithData';

import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

import { LanguageRecord } from '../../db/TableInterfaces.auto';

/** LanugageList props */
const dataWrapper = withData('language');
const connector = compose(withAuth, dataWrapper);

type LanguageListProps = DataProps<typeof dataWrapper> & AuthProps;

/** LanguageList component */
class LanguageList extends React.Component<LanguageListProps> {
  render() {
    const { language, cwp } = this.props;

    /** Button to link to the create language component */
    const createLanguageButton = cwp.admin ? (
      <div className='tmar20 bmar20'>
        <Link to='/language/create'>
          <button className='btn btn-medium'>Create New Language</button>
        </Link>
      </div>
    ) : null;

    const tableColumns: Array<TableColumnType<LanguageRecord>> = [
      { type: 'field', field: 'name', header: 'Name' },
      { type: 'field', field: 'primary_language_name', header: 'Local Language Name' },
      { type: 'field', field: 'locale', header: 'Language Locale' },
      { type: 'field', field: 'iso_639_3_code', header: 'ISO 639-3 Code' },
    ];

    // Edit button function to pass to table creator
    const editButton = (lang: LanguageRecord) => (
      <button className='btn-floating btn-small grey'>
        <Link to={`/language/update/${lang.id}`}>
          <i className='material-icons'>edit</i>
        </Link>
      </button>
    );

    if (cwp.admin) {
      tableColumns.push({ type: 'function', function: editButton, header: 'Edit' });
    }

    return (
      <div className='tmar20'>
        {createLanguageButton}
        {language.status === 'IN_FLIGHT' ? (
          <ProgressBar />
        ) : language.status === 'FAILURE' ? (
          <ErrorMessage message={language.messages} />
        ) : (
          <TableList<LanguageRecord> columns={tableColumns} rows={language.data} emptyMessage='No languages' />
        )}
      </div>
    );
  }
}

export default connector(LanguageList);
