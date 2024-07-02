import { Axolotl } from '@aexol/axolotl-core';
import { graphqlYogaAdapter } from '@aexol/axolotl-graphql-yoga';
import { Models } from './models.js';

export const { createResolvers } = Axolotl(graphqlYogaAdapter)<Models>();
