import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import { Meteor } from 'meteor/meteor';
import { styles } from './styles.scss';
import AudioService from '/imports/ui/components/audio/service';
import Checkbox from '/imports/ui/components/checkbox/component';

const MAX_INPUT_CHARS = Meteor.settings.public.poll.maxTypedAnswerLength;

const intlMessages = defineMessages({
  pollingTitleLabel: {
    id: 'app.polling.pollingTitle',
  },
  pollAnswerLabel: {
    id: 'app.polling.pollAnswerLabel',
  },
  pollAnswerDesc: {
    id: 'app.polling.pollAnswerDesc',
  },
  pollQuestionTitle: {
    id: 'app.polling.pollQuestionTitle',
  },
  responseIsSecret: {
    id: 'app.polling.responseSecret',
  },
  responseNotSecret: {
    id: 'app.polling.responseNotSecret',
  },
  submitLabel: {
    id: 'app.polling.submitLabel',
  },
  submitAriaLabel: {
    id: 'app.polling.submitAriaLabel',
  },
  responsePlaceholder: {
    id: 'app.polling.responsePlaceholder',
  },
});

const validateInput = (i) => {
  let _input = i;
  if (/^\s/.test(_input)) _input = '';
  return _input;
};

class Polling extends Component {
  constructor(props) {
    super(props);

    this.state = {
      typedAns: '',
      checkedAnswers: [],
    };

    this.play = this.play.bind(this);
    this.handleUpdateResponseInput = this.handleUpdateResponseInput.bind(this);
    this.renderButtonAnswers = this.renderButtonAnswers.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderCheckboxAnswers = this.renderCheckboxAnswers.bind(this);
    this.handleMessageKeyDown = this.handleMessageKeyDown.bind(this);
  }

  componentDidMount() {
    this.play();
  }

  play() {
    AudioService.playAlertSound(`${Meteor.settings.public.app.cdn
      + Meteor.settings.public.app.basename
      + Meteor.settings.public.app.instanceId}`
      + '/resources/sounds/Poll.mp3');
  }

  handleUpdateResponseInput(e) {
    this.responseInput.value = validateInput(e.target.value);
    this.setState({ typedAns: this.responseInput.value });
  }

  handleSubmit(pollId) {
    const { handleVote } = this.props;
    const { checkedAnswers } = this.state;
    handleVote(pollId, checkedAnswers);
  }

  handleCheckboxChange(pollId, answerId) {
    const { checkedAnswers } = this.state;
    if (checkedAnswers.includes(answerId)) {
      checkedAnswers.splice(checkedAnswers.indexOf(answerId), 1);
    } else {
      checkedAnswers.push(answerId);
    }
    checkedAnswers.sort();
    this.setState({ checkedAnswers });
  }

  handleMessageKeyDown(e) {
    const {
      poll,
      handleTypedVote,
    } = this.props;

    const {
      typedAns,
    } = this.state;

    if (e.keyCode === 13 && typedAns.length > 0) {
      handleTypedVote(poll.pollId, typedAns);
    }
  }

  renderButtonAnswers(pollAnswerStyles) {
    const {
      isMeteorConnected,
      intl,
      poll,
      handleVote,
      handleTypedVote,
      pollAnswerIds,
      pollTypes,
      isDefaultPoll,
    } = this.props;

    const {
      typedAns,
    } = this.state;

    if (!poll) return null;

    const { answers, question, pollType } = poll;
    const defaultPoll = isDefaultPoll(pollType);

    return (
      <div>
          {
            poll.pollType !== pollTypes.Response && (
              <span>
                {
                  question.length === 0 && (
                    <div className={styles.pollingTitle}>
                      {intl.formatMessage(intlMessages.pollingTitleLabel)}
                    </div>
                  )
                }
                <div className={cx(pollAnswerStyles)}>
                  {answers.map((pollAnswer) => {
                    const formattedMessageIndex = pollAnswer.key.toLowerCase();
                    let label = pollAnswer.key;
                    if (defaultPoll && pollAnswerIds[formattedMessageIndex]) {
                      label = intl.formatMessage(pollAnswerIds[formattedMessageIndex]);
                    }

                    return (
                      <div
                        key={pollAnswer.id}
                        className={styles.pollButtonWrapper}
                      >
                        <Button
                          disabled={!isMeteorConnected}
                          className={styles.pollingButton}
                          color="primary"
                          size="md"
                          label={label}
                          key={pollAnswer.key}
                          onClick={() => handleVote(poll.pollId, [pollAnswer.id])}
                          aria-labelledby={`pollAnswerLabel${pollAnswer.key}`}
                          aria-describedby={`pollAnswerDesc${pollAnswer.key}`}
                          data-test="pollAnswerOption"
                        />
                        <div
                          className={styles.hidden}
                          id={`pollAnswerLabel${pollAnswer.key}`}
                        >
                          {intl.formatMessage(intlMessages.pollAnswerLabel, { 0: label })}
                        </div>
                        <div
                          className={styles.hidden}
                          id={`pollAnswerDesc${pollAnswer.key}`}
                        >
                          {intl.formatMessage(intlMessages.pollAnswerDesc, { 0: label })}
                        </div>
                      </div>
                  );
                })}
              </div>
            </span>
          )
        }
        {
          poll.pollType === pollTypes.Response
          && (
            <div className={styles.typedResponseWrapper}>
              <input
                data-test="pollAnswerOption"
                onChange={(e) => {
                  this.handleUpdateResponseInput(e);
                }}
                onKeyDown={(e) => {
                  this.handleMessageKeyDown(e);
                }}
                type="text"
                className={styles.typedResponseInput}
                placeholder={intl.formatMessage(intlMessages.responsePlaceholder)}
                maxLength={MAX_INPUT_CHARS}
                ref={(r) => { this.responseInput = r; }}
              />
              <Button
                data-test="submitAnswer"
                className={styles.submitVoteBtn}
                disabled={typedAns.length === 0}
                color="primary"
                size="sm"
                label={intl.formatMessage(intlMessages.submitLabel)}
                aria-label={intl.formatMessage(intlMessages.submitAriaLabel)}
                onClick={() => {
                  handleTypedVote(poll.pollId, typedAns);
                }}
              />
            </div>
          )
        }
        <div className={styles.pollingSecret}>
          {intl.formatMessage(poll.secretPoll ? intlMessages.responseIsSecret : intlMessages.responseNotSecret)}
        </div>
      </div>
    );
  }

  renderCheckboxAnswers() {
    const {
      isMeteorConnected,
      intl,
      poll,
      pollAnswerIds,
    } = this.props;
    const { checkedAnswers } = this.state;
    const { question } = poll;
    return (
      <div>
        {question.length === 0
          && (
          <div className={styles.pollingTitle}>
            {intl.formatMessage(intlMessages.pollingTitleLabel)}
          </div>
          )}
        <table className={styles.multipleResponseAnswersTable}>
          {poll.answers.map((pollAnswer) => {
            const formattedMessageIndex = pollAnswer.key.toLowerCase();
            let label = pollAnswer.key;
            if (pollAnswerIds[formattedMessageIndex]) {
              label = intl.formatMessage(pollAnswerIds[formattedMessageIndex]);
            }

            return (
              <tr
                key={pollAnswer.id}
                className={styles.checkboxContainer}
              >
                <td>
                  <Checkbox
                    disabled={!isMeteorConnected}
                    id={`answerInput${pollAnswer.key}`}
                    onChange={() => this.handleCheckboxChange(poll.pollId, pollAnswer.id)}
                    checked={checkedAnswers.includes(pollAnswer.id)}
                    className={styles.checkbox}
                    ariaLabelledBy={`pollAnswerLabel${pollAnswer.key}`}
                    ariaDescribedBy={`pollAnswerDesc${pollAnswer.key}`}
                  />
                </td>
                <td className={styles.multipleResponseAnswersTableAnswerText}>
                  <label id={`pollAnswerLabel${pollAnswer.key}`}>
                    {label}
                  </label>
                  <div
                    className={styles.hidden}
                    id={`pollAnswerDesc${pollAnswer.key}`}
                  >
                    {intl.formatMessage(intlMessages.pollAnswerDesc, { 0: label })}
                  </div>
                </td>
              </tr>
            );
          })}
        </table>
        <div>
          <Button
            className={styles.submitVoteBtn}
            disabled={!isMeteorConnected || checkedAnswers.length === 0}
            color="primary"
            size="sm"
            label={intl.formatMessage(intlMessages.submitLabel)}
            aria-label={intl.formatMessage(intlMessages.submitAriaLabel)}
            onClick={() => this.handleSubmit(poll.pollId)}
          />
        </div>
      </div>
    );
  }

  render() {
    const {
      intl,
      poll,
    } = this.props;

    if (!poll) return null;

    const { stackOptions, answers, question } = poll;
    const pollAnswerStyles = {
      [styles.pollingAnswers]: true,
      [styles.removeColumns]: answers.length === 1,
      [styles.stacked]: stackOptions,
    };

    return (
      <div className={styles.overlay}>
        <div
          data-test="pollingContainer"
          className={cx({
            [styles.pollingContainer]: true,
            [styles.autoWidth]: stackOptions,
          })}
          role="alert"
        >
          {
            question.length > 0 && (
              <span className={styles.qHeader}>
                <div className={styles.qTitle}>
                  {intl.formatMessage(intlMessages.pollQuestionTitle)}
                </div>
                <div data-test="pollQuestion" className={styles.qText}>{question}</div>
              </span>
            )
          }
          {poll.isMultipleResponse ? this.renderCheckboxAnswers(pollAnswerStyles) : this.renderButtonAnswers(pollAnswerStyles)}
        </div>
      </div>
    );
  }
}

export default injectIntl(injectWbResizeEvent(Polling));

Polling.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  handleVote: PropTypes.func.isRequired,
  handleTypedVote: PropTypes.func.isRequired,
  poll: PropTypes.shape({
    pollId: PropTypes.string.isRequired,
    answers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      key: PropTypes.string.isRequired,
    }).isRequired).isRequired,
  }).isRequired,
};
