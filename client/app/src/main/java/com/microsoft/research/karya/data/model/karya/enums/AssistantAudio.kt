package com.microsoft.research.karya.data.model.karya.enums

enum class AssistantAudio(val fileName: String) {
  AGE_PROMPT("audio_age_prompt.m4a"),
  CONSENT_FORM_SUMMARY("audio_consent_form_summary.m4a"),
  GENDER_PROMPT("audio_gender_prompt.m4a"),
  LISTEN_ACTION("audio_listen_action.m4a"),
  NEXT_ACTION("audio_next_action.m4a"),
  OTP_PROMPT("audio_otp_prompt.m4a"),
  PHONE_NUMBER_PROMPT("audio_phone_number_prompt.m4a"),
  PREVIOUS_ACTION("audio_previous_action.m4a"),
  PROFILE_PICTURE_PROMPT("audio_profile_picture_prompt.m4a"),
  RECORD_ACTION("audio_record_action.m4a"),
  RECORD_SENTENCE("audio_record_sentence.m4a"),
  RERECORD_ACTION("audio_rerecord_action.m4a"),
  STOP_ACTION("audio_stop_action.m4a"),
  // IMAGE ANNOTATION
  IMAGE_ANNOTATION_ZOOMAGE_VIEW("image_annotation_book_image.m4a"),
  IMAGE_ANNOTATION_ADD_BUTTON("image_annotation_add_box.m4a"),
  IMAGE_ANNOTATION_RESHAPE("image_annotation_reshape_box.m4a"),
  IMAGE_ANNOTATION_NEXT_BUTTON("image_annotation_next_image.m4a"),
  // SENTENCE CORPUS
  SENTENCE_CORPUS_CONTEXT_TV("sentence_corpus_context.m4a"),
  SENTENCE_CORPUS_EDIT_TEXT("sentence_corpus_input.m4a"),
  SENTENCE_CORPUS_ADD_BUTTON("sentence_corpus_add.m4a"),
  SENTENCE_CORPUS_NEXT_BUTTON("sentence_corpus_next.m4a"),
  SENTENCE_CORPUS_BACK_BUTTON("sentence_corpus_previous.m4a"),
  // SPEECH TRANSCRIPTION
  SPEECH_TRANSCRIPTION_AUDIO_PLAYER("speech_transcription_recording.m4a"),
  SPEECH_TRANSCRIPTION_EDIT_TEXT("speech_transcription_text.m4a"),
  SPEECH_TRANSCRIPTION_ASSISTANCE_LAYOUT("speech_transcription_bow_support.m4a"),
  SPEECH_TRANSCRIPTION_NEXT_BUTTON("speech_transcription_next.m4a"),
  SPEECH_TRANSCRIPTION_BACK_BUTTON("speech_transcription_previous.m4a"),
}
