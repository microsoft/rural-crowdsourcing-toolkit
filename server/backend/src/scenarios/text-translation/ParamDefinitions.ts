
import { TaskRecord } from '../../db/TableInterfaces.auto';
import { ParameterDefinition } from '../common/ParameterTypes';

export const taskParams: ParameterDefinition[] = [
    {
      identifier: 'instruction',
      name: 'Translation Instruction',
      type: 'string',
      description: 'Translation instruction to be shown to the user as a prompt',
      required: true,
    },
  
    {
      identifier: 'sentenceFile',
      name: 'Sentence JSON File',
      type: 'file',
      description:
        'A JSON file containing single array of sentences.',
      required: true,
      max_size: 4096,
      attached: true,
      ext: 'json',
    },
    {
      identifier: 'numTranslation',
      name: 'Number of Translations',
      type: 'integer',
      description:
        'Number of translations needed for each sentence in the input corpus',
      required: true,
    },
    {
      identifier: 'creditsPerTranslation',
      name: 'Credits for Each Translation',
      type: 'float',
      description:
        'Number of credits to be given for each correct Translation',
      required: true,
      default: 1.0,
    },
  ];

  export type TextTranslationTask = TaskRecord & {
    params: {
      instruction: string;
      sentenceFile: string;
      numTranslations: number;
      creditsPerTranslation: number;
      needVerification: boolean;
  
      // dynamic params
      verificationTaskId: number;
      outputFiles: Array<
        [string, 'generating' | 'failed' | 'generated' | 'none', string | null]
      >;
    };
  };