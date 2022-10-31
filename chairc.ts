import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';

chai.use(chaiSpies);
chai.use(chaiAsPromised);
chai.config.includeStack = true;
chai.config.truncateThreshold = 200;

export default chai;
export const expect = chai.expect;