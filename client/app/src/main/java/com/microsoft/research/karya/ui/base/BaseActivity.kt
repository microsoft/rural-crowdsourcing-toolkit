// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This activity defines an abstract class that performs some common functions and provides some
 * common helper functions for other activities in the application. For instance, almost every
 * activity needs to access the database, fetch values for specific string resources, etc.
 */

package com.microsoft.research.karya.ui.base

import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import androidx.annotation.StringRes
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.KaryaDatabase
import com.microsoft.research.karya.data.manager.RetrofitFactory
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.service.KaryaAPIService
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.utils.ImageUtils
import kotlinx.android.synthetic.main.app_toolbar.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

abstract class BaseActivity(
    private val useAssistant: Boolean = false,
    private val playAssistantOnResume: Boolean = true
) : AppCompatActivity() {

    /** Database and API service */
    protected lateinit var karyaDb: KaryaDatabase
    lateinit var karyaAPI: KaryaAPIService

    /** Player for assistant */
    private var assistantAvailable: Boolean = false
    private lateinit var assistantPlayer: MediaPlayer
    private var assistantPaused: Boolean = false

    /** Coroutine scopes */
    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    protected lateinit var setWorkerJob: Job
    private lateinit var setAppLanguageJob: Job
    protected lateinit var getStringsJob: Job

    protected lateinit var thisWorker: WorkerRecord
    protected var appLanguageId: Int? = null
    private var appLanguageChanged = false

    private var salutation = ""

    /**
     * On create, initialize the database, API service, retrieve app language Id
     * */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set db and API service
        karyaDb = KaryaDatabase.getInstance(this)!!
        karyaAPI = RetrofitFactory.create()

        // Reset support action bar title
        this.setSupportActionBar(appTb)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        appTb?.title = ""
        appTb?.subtitle = ""

        // Set worker
        // TODO: Anurag Query: Why are we setting worker in each instance of this activity?
        setWorker() //. Set the worker Job

        // Set user profile picture (this can never be updated currently)
        setUserProfilePicture()
    }

    /**
     * On resume, fetch all the strings and reset UI
     */
    override fun onResume() {
        super.onResume()

        appLanguageChanged = false

        // Reset worker
        setWorker()

        /** Get app language ID */
        setAppLanguageJob = ioScope.launch {
            setWorkerJob.join()
            val oldAppLanguageId = appLanguageId
            appLanguageId = if (this@BaseActivity::thisWorker.isInitialized)
                thisWorker.app_language
            else
                WorkerInformation.app_language
            if (appLanguageId != oldAppLanguageId && appLanguageId != null) {
                appLanguageChanged = true
            }
        }


        // Get strings
        getStringsJob = ioScope.launch {
            setAppLanguageJob.join()
            if (appLanguageChanged) {

                salutation = getValueFromName(R.string.salutation)
                // Set various Strings for the Activity
                getStringsForActivity()
            }
        }

        // Update UI
        uiScope.launch {
            getStringsJob.join()
            if (appLanguageChanged) {
                salutationTv.text = salutation
                setInitialUIStrings()
            }
        }

        if (useAssistant) {
            assistantCv.setOnClickListener { onAssistantClick() }
            assistantCv.visibility = View.VISIBLE

            if (playAssistantOnResume) {
                if (assistantPaused) {
                    assistantPlayer.start()
                    assistantPaused = false
                } else {
                    onAssistantClick()
                }
            }
        }
    }

    /**
     * Set assistant player on start
     */
    override fun onStart() {
        super.onStart()
        /** Initialize the player */
        if (!::assistantPlayer.isInitialized) {
            assistantPlayer = MediaPlayer()
        }
        assistantAvailable = true
    }

    /**
     * On pause, stop assistant
     */
    override fun onPause() {
        super.onPause()
        pauseAssistant()
    }

    /**
     * On stop, mark activity as stopped. Stop playing further audio
     */
    override fun onStop() {
        super.onStop()
        assistantAvailable = false
    }

    override fun onDestroy() {
        super.onDestroy()
        /** Release the player */
        if (::assistantPlayer.isInitialized) {
            stopAssistant()
            assistantPlayer.release()
        }
    }

    /**
     * Set user profile picture
     */
    private fun setUserProfilePicture() {
        uiScope.launch {
            setWorkerJob.join()

            var profilePicture = WorkerInformation.profile_picture

            if (profilePicture == null) {
                val imageFolder = getDir("profile_picture", MODE_PRIVATE).path
                val fileName = "pp.png"
                val filePath = "$imageFolder/$fileName"
                if (File(filePath).exists()) {
                    profilePicture = BitmapFactory.decodeFile(filePath)
                    WorkerInformation.profile_picture = profilePicture
                }
            }

            if (profilePicture != null) {
                ImageUtils.loadImageBitmap(this@BaseActivity, profilePicture, profilePictureIv)
            } else {
                profilePictureIv.visibility = View.GONE
            }
        }
    }

    /**
     * Set worker
     */
    private fun setWorker() {
        setWorkerJob = ioScope.launch {
            val workers = karyaDb.workerDao().getAll()
            if (workers.isNotEmpty()) thisWorker = workers[0]
        }
    }

    /**
     * Function to get all string values needed for the activity
     */
    protected abstract suspend fun getStringsForActivity()

    /**
     * Function to set the initial UI elements for the activity
     */
    protected abstract suspend fun setInitialUIStrings()

    /**
     * Get value from language resource using the resource Id and language Id
     * By value we mean what a particular word is known in a particular language
     */
    protected suspend fun getValueFromName(@StringRes resId: Int, languageId: Int = appLanguageId!!): String {
        val name = getString(resId)
        val value = karyaDb.languageResourceValueDaoExtra().getValueFromName(languageId, name)
            .trim()  // getting language resource value
        return value
    }

    /**
     * Play an audio file using the resource name
     */
    protected fun playAssistantAudio(
        @StringRes resId: Int,
        languageId: Int? = null,
        uiCue: (() -> Unit)? = null,
        onCompletionListener: (() -> Unit)? = null
    ) {
        /** If player is not initialized, return */
        if (!::assistantPlayer.isInitialized || !assistantAvailable) {
            return
        }

        /** Get the audio file path for the given file */
        val name = getString(resId)

        ioScope.launch {
            var audioLanguageId = languageId
            if (languageId == null) {
                setAppLanguageJob.join()
                audioLanguageId = appLanguageId
            }

            val resourceId = karyaDb.languageResourceDaoExtra().getIdFromName(name)
            val audioFilePath = getBlobPath(
                KaryaFileContainer.LANG_RES,
                resourceId.toString(),
                audioLanguageId.toString()
            )

            /** Play the recording if file exists. Else silently fail */
            if (File(audioFilePath).exists()) {
                if (assistantAvailable) {
                    uiScope.launch {
                        if (assistantPlayer.isPlaying) assistantPlayer.stop()

                        /** Set on completion listener if one is provided */
                        assistantPlayer.setOnCompletionListener {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                            if (onCompletionListener != null) {
                                onCompletionListener()
                            }
                        }

                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        if (uiCue != null) uiCue()
                        with(assistantPlayer) {
                            reset()
                            setDataSource(audioFilePath)
                            prepare()
                            start()
                        }
                    }
                }
            } else if (onCompletionListener != null) {
                onCompletionListener()
            }
        }
    }

    /**
     * Stop assistant
     */
    protected fun stopAssistant() {
        if (assistantPlayer.isPlaying)
            assistantPlayer.stop()
    }

    /**
     * Pause assistant
     */
    private fun pauseAssistant() {
        if (assistantPlayer.isPlaying) {
            assistantPlayer.pause()
            assistantPaused = true
        }
    }

    /**
     * Assistant click handler
     */
    protected open fun onAssistantClick() = Unit

    /**
     * Burger menu for showing Microsoft privacy policy
     */
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu, menu)
        return true
    }

    /**
     * Burger menu for showing Microsoft privacy policy
     */
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.privacyPolicy -> {
                val url = "https://go.microsoft.com/fwlink/?LinkId=521839"
                val i = Intent(Intent.ACTION_VIEW)
                i.data = Uri.parse(url)
                startActivity(i)
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    /**
     * Request focus on a text field and show the keyboard
     */
    fun requestSoftKeyFocus(eT: EditText) {
        eT.requestFocus()
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.showSoftInput(eT, InputMethodManager.SHOW_IMPLICIT)
    }

    /**
     * Hide the keyboard
     */
    protected fun hideKeyboard() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        val view = currentFocus ?: View(this)
        imm.hideSoftInputFromWindow(view.windowToken, 0)
    }

    /**
     * Function to get the directory corresponding to the [container]
     */

    fun getContainerDirectory(container: KaryaFileContainer): String {
        return container.getDirectory(this)
    }

    /**
     * Get the blob name for a [container] with specific [params]
     */
    fun getBlobName(container: KaryaFileContainer, vararg params: String): String {
        return container.getBlobName(*params)
    }

    /**
     * Get the blob path for a blob in the [container] with specific [params]
     */
    fun getBlobPath(container: KaryaFileContainer, vararg params: String): String {
        val dir = getContainerDirectory(container)
        val name = getBlobName(container, *params)
        return "$dir/$name"
    }

    /**
     * Helper enum for accessing karya files
     */
    enum class KaryaFileContainer(val cname: String) {

        LANG_RES("lang-res") {
            override fun getBlobName(vararg params: String): String {
                val lrId = params[0]
                val languageId = params[1]
                val ext = "m4a"
                return "$lrId-$languageId.$ext"
            }
        },

        L_LRVS("l-lrvs") {
            override fun getBlobName(vararg params: String): String {
                val languageId = params[0]
                val ext = "tar"
                return "L-$languageId.$ext"
            }
        },

        LR_LRVS("lr-lrvs") {
            override fun getBlobName(vararg params: String): String {
                val lrId = params[0]
                val ext = "tar"
                return "LR-$lrId.$ext"
            }
        },

        MICROTASK_INPUT("microtask-input") {
            override fun getBlobName(vararg params: String): String {
                val microtaskId = params[0]
                val ext = "tgz"
                return "$microtaskId.$ext"
            }
        },

        MICROTASK_ASSIGNMENT_OUTPUT("microtask-assignment-output") {
            override fun getBlobName(vararg params: String): String {
                val assignmentId = params[0]
                val ext = "tgz"
                return "$assignmentId.$ext"
            }
        },

        WORKER_LOGS("worker-logs") {
            override fun getBlobName(vararg params: String): String {
                val workerId = params[0]
                val timestamp = params[1]
                val ext = "gz"
                return "$workerId-$timestamp.$ext"
            }
        };

        /**
         * Get the local directory path for a container
         */
        fun getDirectory(context: Context): String {
            val dir = context.getDir(cname, Context.MODE_PRIVATE)
            return dir.path
        }

        /**
         * get the blob name for a particular container given the parameters
         */
        abstract fun getBlobName(vararg params: String): String
    }

    /**
     * Static helper to get current moment
     */
    companion object {
        fun getCurrentDate(): String {
            val date = Date()
            val simpleDateTimeFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            SimpleDateFormat.getDateTimeInstance()
            simpleDateTimeFormatter.timeZone = TimeZone.getTimeZone("UTC")
            return simpleDateTimeFormatter.format(date)
        }
    }
}
