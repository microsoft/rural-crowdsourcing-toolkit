// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.utils

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.File
import java.io.FileInputStream

private const val CODEC_TIMEOUT_IN_MS = 5000
private const val BUFFER_SIZE = 88200

class RawToAACEncoder(
    private val SamplingRate: Int = 44100,
    private val OutputMimeType: String = "audio/mp4a-latm",
    private val OutputBitRate: Int = 128000
) {

  private var mStop = false
  /** Encode a raw audio file to AAC file */
  fun encode(inputFilePath: String, outputFilePath: String) {
    val fis = FileInputStream(inputFilePath)
    val outputFile = File(outputFilePath)
    if (outputFile.exists()) outputFile.delete()

    val mux = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

    var outputFormat = MediaFormat.createAudioFormat(OutputMimeType, SamplingRate, 1)
    outputFormat.setInteger(
        MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    outputFormat.setInteger(MediaFormat.KEY_BIT_RATE, OutputBitRate)

    val codec = MediaCodec.createEncoderByType(OutputMimeType)
    codec.configure(outputFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    codec.start()

    val codecInputBuffers = codec.inputBuffers
    val codecOutputBuffers = codec.outputBuffers
    val outBuffInfo = MediaCodec.BufferInfo()
    val tempBuffer = ByteArray(BUFFER_SIZE)
    var hasMoreData = true
    var presentationTimeUs = 0.0
    var audioTrackIdx = 0
    var totalBytesRead = 0
    do {
      var inputBufIndex = 0
      while (inputBufIndex != -1 && hasMoreData) {
        inputBufIndex = codec.dequeueInputBuffer(CODEC_TIMEOUT_IN_MS.toLong())
        if (inputBufIndex >= 0) {
          val dstBuf = codecInputBuffers[inputBufIndex]
          dstBuf.clear()
          val bytesRead = fis.read(tempBuffer, 0, dstBuf.limit())
          if (bytesRead == -1) { // -1 implies EOS
            hasMoreData = false
            codec.queueInputBuffer(
                inputBufIndex,
                0,
                0,
                presentationTimeUs.toLong(),
                MediaCodec.BUFFER_FLAG_END_OF_STREAM)
          } else {
            totalBytesRead += bytesRead
            dstBuf.put(tempBuffer, 0, bytesRead)
            codec.queueInputBuffer(inputBufIndex, 0, bytesRead, presentationTimeUs.toLong(), 0)
            presentationTimeUs = 1000000L * (totalBytesRead / 2) / SamplingRate.toDouble()
          }
        }
      }

      // Drain audio
      var outputBufIndex = 0
      while (outputBufIndex != MediaCodec.INFO_TRY_AGAIN_LATER) {
        outputBufIndex = codec.dequeueOutputBuffer(outBuffInfo, CODEC_TIMEOUT_IN_MS.toLong())
        if (outputBufIndex >= 0) {
          val encodedData = codecOutputBuffers[outputBufIndex]
          encodedData.position(outBuffInfo.offset)
          encodedData.limit(outBuffInfo.offset + outBuffInfo.size)
          if (outBuffInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0 &&
              outBuffInfo.size != 0) {
            codec.releaseOutputBuffer(outputBufIndex, false)
          } else {
            mux.writeSampleData(audioTrackIdx, codecOutputBuffers[outputBufIndex], outBuffInfo)
            codec.releaseOutputBuffer(outputBufIndex, false)
          }
        } else if (outputBufIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          outputFormat = codec.outputFormat
          audioTrackIdx = mux.addTrack(outputFormat)
          mux.start()
        }
      }
    } while (outBuffInfo.flags != MediaCodec.BUFFER_FLAG_END_OF_STREAM && !mStop)
    fis.close()
    mux.stop()
    mux.release()
    mStop = false
  }
}
