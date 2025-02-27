import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Breakouts from '/imports/ui/local-collections/breakouts-collection/breakouts';
import Auth from '/imports/ui/services/auth';
import { makeCall } from '/imports/ui/services/api';
import breakoutService from '/imports/ui/components/breakout-room/service';
import AudioManager from '/imports/ui/services/audio-manager';
import BreakoutJoinConfirmationComponent from './component';

const BreakoutJoinConfirmationContrainer = (props) => (
  <BreakoutJoinConfirmationComponent
    {...props}
  />
);

const getURL = (breakoutId) => {
  const currentUserId = Auth.userID;
  const breakout = Breakouts.findOne({ breakoutId }, { fields: { [`url_${currentUserId}`]: 1 } });
  const breakoutUrlData = (breakout && breakout[`url_${currentUserId}`]) ? breakout[`url_${currentUserId}`] : null;
  if (breakoutUrlData) return breakoutUrlData.redirectToHtml5JoinURL;
  return '';
};

const requestJoinURL = (breakoutId) => {
  makeCall('requestJoinURL', {
    breakoutId,
  });
};

export default withTracker(({ breakout, mountModal, breakoutName }) => {
  const isFreeJoin = breakout.freeJoin;
  const { breakoutId } = breakout;
  const url = getURL(breakoutId);

  return {
    isFreeJoin,
    mountModal,
    breakoutName,
    breakoutURL: url,
    breakouts: breakoutService.getBreakouts(),
    requestJoinURL,
    getURL,
    voiceUserJoined: AudioManager.isUsingAudio(),
  };
})(BreakoutJoinConfirmationContrainer);
