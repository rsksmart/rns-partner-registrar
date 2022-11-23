import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';
import { smock } from '@defi-wonderland/smock';

chai.use(chaiSpies);
chai.use(chaiAsPromised);
chai.use(smock.matchers);
chai.config.includeStack = true;
chai.config.truncateThreshold = 200;

export default chai;
export const expect = chai.expect;
