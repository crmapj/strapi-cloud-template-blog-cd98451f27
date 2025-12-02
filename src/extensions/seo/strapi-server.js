'use strict';

const defaultPlugin = require('@strapi-community/plugin-seo/strapi-server');

const getContentManagerOptions = (schema) => {
  if (!schema) {
    return {};
  }

  return (
    schema.pluginOptions?.['content-manager'] ??
    schema.__schema__?.pluginOptions?.['content-manager'] ??
    {}
  );
};

const shouldExposeNonApiType = (schema) => {
  const options = getContentManagerOptions(schema);
  return options.visible === true;
};

const buildContentTypesPayload = (strapi) => {
  const contentTypes = strapi.contentTypes || {};
  const blackListedPlugins = ['upload', 'i18n', 'users-permissions'];

  return Object.keys(contentTypes).reduce(
    (acc, name) => {
      const schema = contentTypes[name];
      if (!schema) {
        return acc;
      }

      const isApiContentType = name.includes('api::');
      const isExposedPluginType = !isApiContentType && shouldExposeNonApiType(schema);

      if (!isApiContentType && !isExposedPluginType) {
        return acc;
      }

      const base = {
        seo: Boolean(schema?.attributes?.seo?.component),
        uid: schema?.uid,
        kind: schema?.kind,
        globalId: schema?.globalId,
        attributes: schema?.attributes,
      };

      if (isApiContentType) {
        if (schema?.kind === 'collectionType') {
          acc.collectionTypes.push(base);
        } else {
          acc.singleTypes.push(base);
        }
      } else {
        const pluginName = name.replace('plugin::', '').split('.')[0];
        if (!blackListedPlugins.includes(pluginName)) {
          acc.plugins.push(base);
        }
      }

      return acc;
    },
    { collectionTypes: [], singleTypes: [], plugins: [] }
  );
};

module.exports = (strapi) => {
  const plugin = defaultPlugin(strapi);
  const defaultSeoService = plugin.services.seo;

  plugin.services.seo = ({ strapi: strapiInstance }) => {
    const originalService = defaultSeoService({ strapi: strapiInstance });

    return {
      ...originalService,
      // Strapi v5 removed the internal "__schema__" property. This override
      // rebuilds the plugin's payload without assuming that legacy field exists.
      getContentTypes() {
        return buildContentTypesPayload(strapiInstance);
      },
    };
  };

  return plugin;
};
