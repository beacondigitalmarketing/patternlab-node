'use strict';
const _ = require('lodash');
const path = require('path');

const logger = require('./log');
const events = require('./events');

let chokidar = require('chokidar'); // eslint-disable-line prefer-const

const watchPatternLabFiles = (
  patternlab,
  assetDirectories,
  basePath,
  watchOnce
) => {
  // watch global structures, such as _data/* and _meta/
  const globalSources = [
    assetDirectories.source.data,
    assetDirectories.source.meta,
  ];
  const globalPaths = globalSources.map(globalSource =>
    path.join(basePath, globalSource, '*')
  );

  _.each(globalPaths, globalPath => {
    logger.debug(`Pattern Lab is watching ${globalPath} for changes`);

    if (patternlab.watchers[globalPath]) {
      patternlab.watchers[globalPath].close();
    }

    const globalWatcher = chokidar.watch(path.resolve(globalPath), {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
      persistent: !watchOnce,
    });

    //watch for changes and rebuild
    globalWatcher
      .on('addDir', p => {
        patternlab.events.emit(events.PATTERNLAB_GLOBAL_CHANGE, {
          file: p,
        });
      })
      .on('add', p => {
        patternlab.events.emit(events.PATTERNLAB_GLOBAL_CHANGE, {
          file: p,
        });
      })
      .on('change', p => {
        patternlab.events.emit(events.PATTERNLAB_GLOBAL_CHANGE, {
          file: p,
        });
      });

    patternlab.watchers[globalPath] = globalWatcher;
  });

  // watch patterns
  const baseFileExtensions = ['.json', '.yml', '.yaml', '.md'];
  const patternWatches = baseFileExtensions
    .concat(patternlab.engines.getSupportedFileExtensions())
    .map(dotExtension =>
      path.join(
        basePath,
        assetDirectories.source.patterns,
        `/**/*${dotExtension}`
      )
    );
  _.each(patternWatches, patternWatchPath => {
    logger.debug(`Pattern Lab is watching ${patternWatchPath} for changes`);

    const patternWatcher = chokidar.watch(path.resolve(patternWatchPath), {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    //watch for changes and rebuild
    patternWatcher
      .on('addDir', p => {
        patternlab.events.emit(events.PATTERNLAB_PATTERN_CHANGE, {
          file: p,
        });
      })
      .on('add', p => {
        patternlab.events.emit(events.PATTERNLAB_PATTERN_CHANGE, {
          file: p,
        });
      })
      .on('change', p => {
        patternlab.events.emit(events.PATTERNLAB_PATTERN_CHANGE, {
          file: p,
        });
      });
  });

  logger.info(
    `Pattern Lab is watching for changes to files under ${
      assetDirectories.source.root
    }`
  );
};

module.exports = watchPatternLabFiles;