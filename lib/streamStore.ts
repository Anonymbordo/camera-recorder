/* eslint-disable no-var */
import ffmpeg from 'fluent-ffmpeg'

declare global {
  var activeStreams: { [key: string]: ffmpeg.FfmpegCommand } | undefined
  var activeRecordings: { [key: string]: any } | undefined
}

export const getActiveStreams = () => {
  if (!global.activeStreams) {
    global.activeStreams = {}
  }
  return global.activeStreams
}

export const getActiveRecordings = () => {
  if (!global.activeRecordings) {
    global.activeRecordings = {}
  }
  return global.activeRecordings
}
