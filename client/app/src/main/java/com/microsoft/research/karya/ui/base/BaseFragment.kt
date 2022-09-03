package com.microsoft.research.karya.ui.base

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.annotation.LayoutRes
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.fragment.app.Fragment
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.KaryaException
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.LanguageType
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.ui.assistant.Assistant
import com.microsoft.research.karya.ui.assistant.AssistantFactory
import com.microsoft.research.karya.ui.views.KaryaToolbar
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.extensions.finish
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

abstract class BaseFragment : Fragment {

  constructor() : super()
  constructor(@LayoutRes contentLayoutId: Int) : super(contentLayoutId)

  @Inject
  lateinit var authManagerBase: AuthManager

  @Inject
  lateinit var workerRepositoryBase: WorkerRepository

  @Inject
  lateinit var assistantFactory: AssistantFactory
  lateinit var assistant: Assistant

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    assistant = assistantFactory.create(viewLifecycleOwner)
    return super.onCreateView(inflater, container, savedInstanceState)
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    val toolbar = this.view?.findViewById<KaryaToolbar>(R.id.appTb)
    toolbar?.setLanguageUpdater { l -> updateUserLanguage(l) }
  }

  /**
   * Get message corresponding to an exception. If it is a Karya exception, then it will have a
   * resource ID that we can use to the get the appropriate message.
   */
  fun getErrorMessage(throwable: Throwable): String {
    val context = requireContext()
    return when (throwable) {
      is KaryaException -> throwable.getMessage(context)
      else -> throwable.message ?: context.getString(R.string.unknown_error)
    }
  }

  private fun updateUserLanguage(lang: LanguageType) {
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val worker = authManagerBase.getLoggedInWorker()
        workerRepositoryBase.updateLanguage(worker.id, lang.toString())
        CoroutineScope(Dispatchers.Main).launch {
          val intent = activity?.intent
          if (intent != null) {
            finish()
            startActivity(intent)
          }
        }
      } catch (e: Exception) {
        // Ignore exceptions
      }
    }
  }
}
