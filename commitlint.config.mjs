import defaultConfig from '@commitlint/config-conventional';

const [defaultTypeSeverity, defaultTypeCondition, defaultTypeEnums] =
  defaultConfig.rules['type-enum'];

const [defaultCaseSeverity, _defaultCaseCondition, defaultCaseEnums] =
  defaultConfig.rules['subject-case'];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      defaultTypeSeverity,
      defaultTypeCondition,
      ['release', ...defaultTypeEnums],
    ],
    'subject-case': [
      defaultCaseSeverity,
      'always',
      ['sentence-case', ...defaultCaseEnums],
    ],
  },
};
