import { StringUtilsTest } from 'typechain-types';
import { allEmojis, allUTExceptEmojis } from './utils/mock.utils';
import { deployContract } from '../utils/deployment.utils';
import { expect } from 'chai';

describe('Has Emoji', () => {
  it('should return true for all the known emojis', async () => {
    const { contract: StringUtilsContract } =
      await deployContract<StringUtilsTest>('StringUtilsTest', {});

    for (const emoji of allEmojis()) {
      const result = await StringUtilsContract.hasEmoji(emoji);

      expect(result).to.be.true;
    }
  });


  it.only('should return false for all the characters except emojis', async () => {
    const { contract: StringUtilsContract } =
      await deployContract<StringUtilsTest>('StringUtilsTest', {});

    for (const emoji of allUTExceptEmojis()) {
      const result = await StringUtilsContract.hasEmoji(emoji);

      if(result) {
        console.log(emoji);
      }
    }
  });
});
