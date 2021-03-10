import {RNFFmpegConfig, RNFFprobe, RNFFmpeg} from 'react-native-ffmpeg';
import * as FileSystem from 'expo-file-system';

const renditions = [
  {resolution: '480x842', bitrate: '1400k', audiorate: '128k'},
  {resolution: '720x1280', bitrate: '2800k', audiorate: '128k'},
  {resolution: '1080x1920', bitrate: '5000k', audiorate: '192k'},
];

const segment_target_duration = 2;     // try to create a new segment every X seconds
const max_bitrate_ratio = 1.07;         // maximum accepted bitrate fluctuations
const rate_monitor_buffer_ratio = 1.5;  // maximum buffer size between bitrate conformance checks

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default async function encodeHLS(source: string, progressCallback) {
  let target = FileSystem.cacheDirectory + uuidv4();
  await FileSystem.makeDirectoryAsync(target, {intermediates: true});
  let re = /[+-]?\d+(\.\d+)? fps/;
  let key_frames_interval = '50';
  let resultProbe = await RNFFprobe.execute(`-i ${source}`);
  let mediaInfo = await RNFFprobe.getMediaInformation(source);
  console.log(mediaInfo);
  let frames = 10000;
  let streams = mediaInfo.getStreams();
  if (streams !== undefined) {
    for (let i = 0; i < streams.length; ++i) {
      let stream = streams[i];
      if (stream.getAllProperties().codec_type !== undefined && stream.getAllProperties().codec_type == 'video') {
        if (stream.getAllProperties().nb_frames !== undefined) {
          frames = parseFloat(stream.getAllProperties().nb_frames);
        }
      }
    }
  }

  if (resultProbe === 0) {
    let output = await RNFFmpegConfig.getLastCommandOutput();
    let fpsStrArr = output.match(re);
    if (fpsStrArr != null && fpsStrArr.length > 0) {
      let fpsStr = fpsStrArr[0].replace(' fps', '');
      key_frames_interval = (parseFloat(fpsStr) * 2 / 10 * 10).toFixed(0);
    }

    // static parameters that are similar for all renditions
    let static_params = '-c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0';
    static_params += ` -g ${key_frames_interval} -keyint_min ${key_frames_interval} -hls_time ${segment_target_duration}`;
    static_params += ' -hls_playlist_type vod';

    // misc params
    let misc_params = '-hide_banner -y';
    let master_playlist = '#EXTM3U\n#EXT-X-VERSION:3\n';

    let cmd = '';
    for (let rendition of renditions) {
      // rendition fields
      let resolution = rendition.resolution;
      let bitrate = parseInt(rendition.bitrate.replace('k', ''));
      let audiorate = rendition.audiorate;

      // calculated fields
      let width = resolution.split('x')[0];
      let height = resolution.split('x')[1];
      let maxrate = bitrate * max_bitrate_ratio;
      let bufsize = bitrate * rate_monitor_buffer_ratio;
      let bandwidth = `${bitrate}000`;
      let name = `${height}p`;

      cmd += ` ${static_params} -vf scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease`;
      cmd += ` -b:v ${bitrate} -maxrate ${maxrate}k -bufsize ${bufsize}k -b:a ${audiorate}`;
      cmd += ` -hls_segment_filename ${target}/${name}_%03d.ts ${target}/${name}.m3u8`;

      // add rendition entry in the master playlist
      master_playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${name}.m3u8\n`;
    }
    console.log(cmd);

    let statisticsCallback = (statistics) => {
      progressCallback(statistics.videoFrameNumber / frames);
    };
    RNFFmpegConfig.enableStatisticsCallback(statisticsCallback);
    let resultEncode = await RNFFmpeg.execute(`${misc_params} -i ${source} ${cmd}`);
    if (resultEncode === 0) {
      RNFFmpegConfig.disableStatistics();
      let resultSS = await RNFFmpeg.execute(`-i ${source} -vframes 1 -q:v 2 ${target}/cover.jpg -hide_banner`);
      if (resultSS === 0) {
        await FileSystem.writeAsStringAsync(`${target}/playlist.m3u8`, master_playlist, {});
        return target;
      } else {
        return null;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}
