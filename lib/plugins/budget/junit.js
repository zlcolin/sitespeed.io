import { join, resolve } from 'node:path';
import { parse } from 'node:url';

import jrp from 'junit-report-builder';

import intel from 'intel';
const log = intel.getLogger('sitespeedio.plugin.budget');

import merge from 'lodash.merge';

export function writeJunit(results, dir, options) {
  // lets have one suite per URL
  const urls = Object.keys(merge({}, results.failing, results.working));

  for (const url of urls) {
    // The URL can be an alias
    let name = url;
    if (url.startsWith('http')) {
      const parsedUrl = parse(url);
      name = url.startsWith('http') ? url : url;
      parsedUrl.hostname.replace(/\./g, '_') +
        '.' +
        parsedUrl.path.replace(/\./g, '_').replace(/\//g, '_');
    }

    const suite = jrp
      .testSuite()
      .name(options.budget.friendlyName || 'sitespeed.io' + '.' + name);

    if (results.failing[url]) {
      for (const result of results.failing[url]) {
        suite
          .testCase()
          .className(name)
          .name(result.type + '.' + result.metric)
          .failure(
            result.metric + ' is ' + result.friendlyValue ||
              result.value +
                ' and limit ' +
                result.limitType +
                ' ' +
                result.friendlyLimit ||
              result.limit + ' ' + url
          );
      }
    }

    if (results.working[url]) {
      for (const result of results.working[url]) {
        suite
          .testCase()
          .className(name)
          .name(result.type + '.' + result.metric)
          .standardOutput(
            result.metric + ' is ' + result.friendlyValue ||
              result.value +
                ' and limit ' +
                result.limitType +
                ' ' +
                result.friendlyLimit ||
              result.limit + ' ' + url
          );
      }
    }
  }
  const file = join(dir, 'junit.xml');
  log.info('Write junit budget to %s', resolve(file));
  jrp.writeTo(file);
}
