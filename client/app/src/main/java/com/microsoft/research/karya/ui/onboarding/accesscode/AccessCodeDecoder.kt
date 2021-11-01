package com.microsoft.research.karya.ui.onboarding.accesscode

import android.content.Context
import com.microsoft.research.karya.data.exceptions.InvalidAccessCodeException
import org.json.JSONObject
import kotlin.properties.Delegates

private const val VERSION_0: Long = 0
private const val VERSION_1: Long = 1

private const val PHYSICAL: Int = 0
private const val VIRTUAL: Int = 1

private const val DEV = 0
private const val PROD = 1

private const val DIRECT_MAP = 0
private const val TEMPLATE = 1

private const val DEFAULT_URL: String = "https://www.DEFAULT_URL.com"
private const val PHYSICAL_BOX_URL: String = "http://PRIVATE_IP:PORT"
private const val DEV_URL: String = "http://localhost:8080"

private const val ACCESS_CODE_MAPPING_FILENAME = "accessCodeMappings.json"

class AccessCodeDecoder {
  companion object {
    private var accessCodeLength by Delegates.notNull<Int>()
    private var version by Delegates.notNull<Long>()
    private var boxType: Int? = null
    private var environment: Int? = null
    private var embeddingMechanism: Int? = null
    private lateinit var url: String

    fun decodeURL(context: Context, accessCode: String): String {
      try {
        val accessCodeLong = accessCode.toLong()
        version = accessCodeLong and 3
        accessCodeLength = getAccessCodeLength(accessCodeLong, version)
        boxType = getBoxType(accessCodeLong, version)
        environment = getEnvironment(accessCodeLong, version)
        embeddingMechanism = getEmbeddingMechanism(accessCodeLong, version)
        url = getURL(context, accessCodeLong, version, boxType, environment, embeddingMechanism)

        if (accessCode.length != accessCodeLength)
          throw InvalidAccessCodeException()

        return url
      } catch (e: Throwable) {
        // TODO: Log the error somewhere
        return DEFAULT_URL
      }

    }

    private fun getURL(
      context: Context,
      accessCodeLong: Long,
      version: Long,
      boxType: Int?,
      environment: Int?,
      embeddingMechanism: Int?
    ): String {
      return when (version) {
        VERSION_1 -> {
          if (boxType == PHYSICAL) PHYSICAL_BOX_URL
          if (environment == DEV) DEV_URL

          val jsonMapping = getAccessCodeJSONMapping(context)
          return if (embeddingMechanism == DIRECT_MAP) {
            val mapArray = jsonMapping.getJSONArray("directs")
            val index = (accessCodeLong and 4032).shr(6).toInt()
            // Check if index is available in mappings array
            if (index > mapArray.length())
              throw InvalidAccessCodeException()
            mapArray.getString(index)
          } else {
            val templatesArray = jsonMapping.getJSONArray("templates")
            val id = (accessCodeLong and 4032).shr(6).toInt()
            val index = (accessCodeLong and 28672).shr(9).toInt()
            val templateString = templatesArray.getString(index)
            // Check if index is available in templates array
            if (index > templatesArray.length())
              throw InvalidAccessCodeException()
            templateString.replace("#".toRegex(), id.toString())
          }
        }
        VERSION_0 -> DEFAULT_URL
        else -> throw InvalidAccessCodeException()
      }
    }

    private fun getAccessCodeJSONMapping(context: Context): JSONObject {
      val fileInString: String =
        context.assets.open(ACCESS_CODE_MAPPING_FILENAME).bufferedReader().use { it.readText() }
      return JSONObject(fileInString)
    }

    private fun getEmbeddingMechanism(accessCodeLong: Long, version: Long): Int? {
      if (version == VERSION_1) {
        return (accessCodeLong and 32).shr(5).toInt()
      }

      return null
    }

    private fun getEnvironment(accessCodeLong: Long, version: Long): Int? {
      if (version == VERSION_1) {
        return (accessCodeLong and 16).shr(4).toInt()
      }

      return null
    }

    private fun getBoxType(accessCodeLong: Long, version: Long): Int? {
      if (version == VERSION_1) {
        return (accessCodeLong and 8).shr(3).toInt()
      }
      return null
    }

    private fun getAccessCodeLength(accessCodeLong: Long, version: Long): Int {
      return when (version) {
        VERSION_0 -> (accessCodeLong and 60).shr(2).toInt() + 1
        VERSION_1 -> if ((accessCodeLong and 4).shr(2) == 0L) 8 else 16
        else -> throw Exception("Bad Access Code")
      }
    }
  }

}
