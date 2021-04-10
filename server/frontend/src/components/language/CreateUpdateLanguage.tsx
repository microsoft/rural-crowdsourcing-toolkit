// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to create a new language or update an existing language. On
 * success, the component redirects to the language list page. In case of an
 * error, the component displays the message and allows a retry.
 */

import React, { ChangeEventHandler, Component, FormEventHandler } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Language } from '@karya/db';

import { SubmitOrCancel, TextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

import { BackendRequestInitAction } from '../../store/apis/APIs.auto';

/** RouteProps */
type RouteParams = { id?: string };
type RouterProps = RouteComponentProps<RouteParams>;

/** Load chosen language from URL params to props. Empty if no update ID */
const mapStateToProps = (state: RootState, ownProps: RouterProps) => {
  const update_id = ownProps.match.params.id || '0';
  const language = update_id ? state.all.language.data.find((l) => l.id === update_id) || {} : {};
  const { data, ...request } = state.all.language;
  return { language, request };
};

/** Map create/update action creator to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
    createLanguage: (language: Language) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language',
        label: 'CREATE',
        request: language,
      };
      dispatch(action);
    },
    updateLanguage: (id: string, language: Language) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language',
        label: 'UPDATE_BY_ID',
        id,
        request: language,
      };
      dispatch(action);
    },
  };
};

/** Create the connector HoC for the component */
const connector = connect(mapStateToProps, mapDispatchToProps);

/** This component has only RouterProps & ConnectedProps */
type CreateUpdateLanguageProps = RouterProps & ConnectedProps<typeof connector>;

/** State maintains existing language in forms and status of requests if any */
type CreateUpdateLanguageState = {
  language: Language;
};

/**
 * CreateUpdateLanguage component
 */
class CreateUpdateLanguage extends Component<CreateUpdateLanguageProps, CreateUpdateLanguageState> {
  /**
   * Set up the language state and update with input language props.
   * Request status is set to success by default.
   */
  state: CreateUpdateLanguageState = {
    language: {
      name: '',
      primary_language_name: '',
      locale: '',
      iso_639_3_code: '',
      ...this.props.language,
    },
  };

  /**
   * Update text fields -- removes overlapping labels and text. May not be
   * necessary in a future version of materialize
   */
  componentDidMount() {
    M.updateTextFields();
  }

  /**
   * If the inflight request is successful, redirect to the language list page
   * @param prevProps Previous props
   */
  componentDidUpdate(prevProps: CreateUpdateLanguageProps) {
    if (prevProps.request.status === 'IN_FLIGHT' && this.props.request.status === 'SUCCESS') {
      this.props.history.push('/language');
    }
  }

  /**
   * Change event handler for the form input fields. Match the state with the
   * values in the form
   */
  handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const language = {
      ...this.state.language,
      [e.currentTarget.id]: e.currentTarget.value,
    };
    this.setState({ ...this.state, language });
  };

  /**
   * Handle form submission. Send out request to create/update the new language.
   */
  handleSubmit: FormEventHandler = (e) => {
    // prevent default action
    e.preventDefault();
    const { language } = this.state;
    language.id ? this.props.updateLanguage(language.id, language) : this.props.createLanguage(language);
  };

  render() {
    const { language } = this.state;
    const { request } = this.props;
    const requestInFlight = request.status === 'IN_FLIGHT';

    // If there is an error, create error message element
    const errorMessageElement = request.status === 'FAILURE' ? <ErrorMessage message={request.messages} /> : null;

    // Get language name from the state --- to be displayed as part of the label
    const languageName = language.name === '' ? 'the language' : language.name;

    // String to be shown on the submit button depending on operation
    const submitString = language.id ? 'Update Language' : 'Create Language';

    // Display submit-cancel buttons only if there are no in-flight requests
    const submitCancelButtons = requestInFlight ? (
      <ProgressBar />
    ) : (
      <SubmitOrCancel submitString={submitString} cancelAction='link' cancelLink='/language' />
    );

    // disable text when there is an active request in flight
    const textDisabled = requestInFlight ? true : false;

    return (
      <div className='tmar20 pad20 light-border'>
        {/** Display any error message */}
        {errorMessageElement}

        {/** Render the create/update form */}
        <form onSubmit={this.handleSubmit}>
          <TextInput
            label='Name of the language in English'
            id='name'
            required={true}
            value={language.name}
            onChange={this.handleChange}
            disabled={textDisabled}
          />

          <TextInput
            label={`Name of the language in ${languageName}`}
            id='primary_language_name'
            required={true}
            value={language.primary_language_name}
            onChange={this.handleChange}
            disabled={textDisabled}
          />

          <TextInput
            label={`Locale string for ${languageName}`}
            id='locale'
            required={true}
            value={language.locale}
            onChange={this.handleChange}
            disabled={textDisabled}
          />

          <TextInput
            label={`ISO 639-3 code for ${languageName}`}
            id='iso_639_3_code'
            required={true}
            value={language.iso_639_3_code}
            onChange={this.handleChange}
            disabled={textDisabled}
          />

          {submitCancelButtons}
        </form>
      </div>
    );
  }
}

export default connector(CreateUpdateLanguage);
