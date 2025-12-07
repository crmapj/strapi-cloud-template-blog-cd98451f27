'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { authors, posts } = require('../data/data.json');

async function seedExampleApp() {
  const shouldImportSeedData = await isFirstRun();

  if (!shouldImportSeedData) {
    strapi.log.info('Seed data already imported; skipping.');
    return;
  }

  try {
    strapi.log.info('Seeding minimal blog data (authors + posts)...');
    await importSeedData();
    strapi.log.info('Seed complete.');
  } catch (error) {
    strapi.log.error('Could not import seed data');
    strapi.log.error(error);
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  const allPermissionsToCreate = [];
  Object.keys(newPermissions).forEach((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) =>
      strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      })
    );
    allPermissionsToCreate.push(...permissionsToCreate);
  });

  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  return fs.statSync(filePath).size;
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: name,
          caption: name,
          name,
        },
      },
    });
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];

  for (const fileName of files) {
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: { name: fileName.replace(/\..*$/, '') },
    });

    if (fileWhereName) {
      existingFiles.push(fileWhereName);
    } else {
      const fileData = getFileData(fileName);
      const fileNameNoExtension = fileName.split('.').shift();
      const [file] = await uploadFile(fileData, fileNameNoExtension);
      uploadedFiles.push(file);
    }
  }

  const allFiles = [...existingFiles, ...uploadedFiles];
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function createEntry({ model, entry }) {
  try {
    return await strapi.documents(`api::${model}.${model}`).create({ data: entry });
  } catch (error) {
    strapi.log.error({ model, entry, error });
    throw error;
  }
}

async function prepareSeo(seo) {
  if (!seo) return undefined;

  const metaImage =
    seo.metaImage && typeof seo.metaImage === 'string'
      ? await checkFileExistsBeforeUpload([seo.metaImage])
      : null;

  const metaSocial = Array.isArray(seo.metaSocial)
    ? await Promise.all(
        seo.metaSocial.map(async (item) => {
          const socialImage =
            item.image && typeof item.image === 'string'
              ? await checkFileExistsBeforeUpload([item.image])
              : null;

          return {
            socialNetwork: item.socialNetwork,
            title: item.title,
            description: item.description,
            image: socialImage ? { connect: [socialImage.id] } : undefined,
          };
        })
      )
    : undefined;

  return {
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    canonicalURL: seo.canonicalURL,
    metaImage: metaImage ? { connect: [metaImage.id] } : undefined,
    metaSocial,
  };
}

async function importAuthors() {
  const authorIdMap = new Map();

  for (const [index, author] of authors.entries()) {
    const avatar = author.avatar
      ? await checkFileExistsBeforeUpload([author.avatar])
      : null;

    const created = await createEntry({
      model: 'author',
      entry: {
        name: author.name,
        email: author.email,
        avatar: avatar ? { connect: [avatar.id] } : undefined,
      },
    });

    authorIdMap.set(index + 1, created.id);
  }

  return authorIdMap;
}

async function importPosts(authorIdMap) {
  for (const post of posts) {
    const cover = post.coverImage
      ? await checkFileExistsBeforeUpload([post.coverImage])
      : null;

    const authorRef = post.author?.id ? authorIdMap.get(post.author.id) : null;
    const seo = await prepareSeo(post.seo);

    const entry = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      publishedAt: new Date().toISOString(),
      author: authorRef ? { connect: [authorRef] } : undefined,
      coverImage: cover ? { connect: [cover.id] } : undefined,
      seo,
    };

    await createEntry({ model: 'post', entry });
  }
}

async function importSeedData() {
  await setPublicPermissions({
    post: ['find', 'findOne'],
    author: ['find', 'findOne'],
  });

  const authorIdMap = await importAuthors();
  await importPosts(authorIdMap);
}

module.exports = async () => {
  await seedExampleApp();
};
