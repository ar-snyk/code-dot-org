import React from 'react';
import {shallow} from 'enzyme';
import {expect} from '../../util/reconfiguredChai';
import BackButton from '@cdo/apps/tutorialExplorer/backButton';
import i18n from '@cdo/tutorialExplorer/locale';

describe('BackButton', () => {
  it('renders a left-arrow back button', () => {
    const wrapper = shallow(<BackButton />);
    expect(
      wrapper.containsMatchingElement(
        <a href="/learn">
          <button type="button">
            <i className="fa fa-arrow-left" />
            &nbsp;
            {i18n.backButtonBack()}
          </button>
        </a>
      )
    ).to.be.ok;
  });
});
