/**
 * Database Queries Barrel Export
 *
 * Exports all query helper functions for content management.
 */

// Content base queries
export {
  getContentById,
  getContentBySlug,
  getContentBySlugOnly,
  listContent,
  countContent,
  updateContentStatus,
  archiveContent,
  type ListContentOptions,
} from './content';

// Project queries
export {
  getProjectWithTranslation,
  getProjectWithAllTranslations,
  listProjects,
  countProjects,
  createProject,
  updateProject,
  type ListProjectsOptions,
  type CreateProjectData,
  type UpdateProjectData,
} from './projects';

// Material queries
export {
  getMaterialWithTranslation,
  getMaterialWithAllTranslations,
  listMaterials,
  countMaterials,
  createMaterial,
  updateMaterial,
  type ListMaterialsOptions,
  type CreateMaterialData,
  type UpdateMaterialData,
} from './materials';

// News queries
export {
  getNewsWithTranslation,
  getNewsWithAllTranslations,
  listNews,
  countNews,
  createNews,
  updateNews,
  type ListNewsOptions,
  type CreateNewsData,
  type UpdateNewsData,
} from './news';

// Translation queries
export {
  getTranslation,
  getAllTranslations,
  upsertTranslation,
  type TranslationData,
} from './translations';

// Junction table queries
export {
  getProjectTechnologies,
  assignTechnologies,
  removeTechnology,
  getNewsTags,
  assignTags,
  removeTag,
  getProjectByContentId,
  getNewsByContentId,
} from './relations';

// Lookup table queries
export {
  listTechnologies,
  getTechnologyById,
  getTechnologyByName,
  createTechnology,
  updateTechnology,
  isTechnologyReferenced,
  deleteTechnology,
  listTags,
  getTagById,
  getTagBySlug,
  createTag,
  updateTag,
  isTagReferenced,
  deleteTag,
  type CreateTechnologyData,
  type UpdateTechnologyData,
  type CreateTagData,
  type UpdateTagData,
} from './lookups';

// Media queries
export {
  insertMedia,
  getMediaById,
  listMedia,
  listDeletedMedia,
  countMedia,
  countDeletedMedia,
  updateMediaAltText,
  updateMediaVariants,
  softDeleteMedia,
  restoreMedia,
  getExpiredSoftDeletedMedia,
  permanentlyDeleteMedia,
  type ListMediaOptions,
  type ListDeletedMediaOptions,
} from './media';
