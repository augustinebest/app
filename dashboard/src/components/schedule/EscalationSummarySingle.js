import React from 'react';
import PropTypes from 'prop-types';
import DateTime from '../../utils/DateTime';
import moment from 'moment-timezone';

const EscalationSummarySingle = ({
    isActiveTeam,
    isNextActiveTeam,
    teamMemberList,
    groups: groupList,
    escalation,
    hasNextEscalationPolicy,
    currentEscalationPolicyCount,
}) => {
    const data = isActiveTeam
        ? escalation.activeTeam
        : escalation.nextActiveTeam;
    let teamMembers = [];

    if (data) {
        teamMembers = data.teamMembers;
    }
    const teams = teamMembers && teamMembers.filter(team => team.userId);
    const groups = teamMembers && teamMembers.filter(group => group.groupId);

    const teamMembersOnPartialDutyCount = teamMembers.filter(member => {
        return (
            member.startTime &&
            member.startTime !== '' &&
            member.endTime &&
            member.endTime !== ''
        );
    }).length;

    return (
        <>
            {isActiveTeam && (
                <div className="bs-Fieldset-row">
                    <div className="bs-Fieldset-fields">
                        <div className="team-header-label">
                            <h3
                                style={{
                                    width: '250px',
                                    marginLeft: '140px',
                                    marginTop: '20px',
                                }}
                            >
                                {' '}
                                <span className="greendot"></span>{' '}
                                {'On Active Duty: Team 1'}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {isNextActiveTeam && (
                <div className="bs-Fieldset-row">
                    <div className="bs-Fieldset-fields">
                        <div className="team-header-label">
                            <h3
                                style={{
                                    width: '250px',
                                    marginLeft: '140px',
                                    marginTop: '20px',
                                }}
                            >
                                {' '}
                                <span className="yellowdot"></span>{' '}
                                {'Next Team Scheduled: Team 2'}
                            </h3>
                        </div>
                    </div>
                </div>
            )}
            {teams.length > 0 ? (
                <div className="bs-Fieldset-row">
                    <label className="bs-Fieldset-label">
                        <b>Team Members</b>
                    </label>
                    <div
                        className="bs-Fieldset-fields labelfield"
                        style={{ marginTop: '-1px' }}
                    >
                        {teams.length > 0 &&
                            teams.map(member => {
                                let membersFromList = teamMemberList.filter(
                                    memberFromList => {
                                        return (
                                            memberFromList.userId ===
                                            member.userId
                                        );
                                    }
                                );

                                if (membersFromList.length > 0) {
                                    membersFromList = membersFromList[0];
                                }

                                return (
                                    <div
                                        key={
                                            member.groupId
                                                ? member.groupId
                                                : membersFromList.id
                                        }
                                        className="Box-root Margin-right--16 pointer"
                                    >
                                        <img
                                            src="/dashboard/assets/img/profile-user.svg"
                                            key={
                                                member.groupId
                                                    ? member.groupId
                                                    : membersFromList.id
                                            }
                                            className="userIcon"
                                            alt=""
                                        />
                                        <span>
                                            {member.groupId
                                                ? member.groups.name
                                                : membersFromList.name
                                                ? membersFromList.name
                                                : membersFromList.email}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            ) : null}
            {groups && groups.length > 0 ? (
                <div className="bs-Fieldset-row">
                    <label className="bs-Fieldset-label">
                        <b>Groups</b>
                    </label>
                    <div
                        className="bs-Fieldset-fields labelfield"
                        style={{ marginTop: '-1px' }}
                    >
                        {groups.length > 0 &&
                            groups.map(group => {
                                return (
                                    <div
                                        key={group.groupId}
                                        className="Box-root Margin-right--16 pointer"
                                    >
                                        <img
                                            src="/dashboard/assets/img/group-image.png"
                                            key={''}
                                            className="userIcon"
                                            alt=""
                                        />
                                        <span>{group.groups.name}</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            ) : null}

            {data && data.rotationStartTime && (
                <div className="bs-Fieldset-row">
                    <label className="bs-Fieldset-label">
                        <b>On-Call Duty Start Time</b>
                    </label>
                    <div className="bs-Fieldset-fields labelfield">
                        {data && data.rotationStartTime
                            ? DateTime.format(
                                  DateTime.convertToCurrentTimezone(
                                      data.rotationStartTime,
                                      data.rotationTimezone
                                  ),
                                  'ddd, Do MMM: hh:mm A'
                              )
                            : ''}
                    </div>
                </div>
            )}

            {data && data.rotationEndTime && (
                <div className="bs-Fieldset-row">
                    <label className="bs-Fieldset-label">
                        <b>On-Call Duty End Time</b>
                    </label>
                    <div className="bs-Fieldset-fields labelfield">
                        {data && data.rotationEndTime
                            ? DateTime.format(
                                  DateTime.convertToCurrentTimezone(
                                      data.rotationEndTime,
                                      data.rotationTimezone
                                  ),
                                  'ddd, Do MMM: hh:mm A'
                              )
                            : ''}
                    </div>
                </div>
            )}

            {data && !data.rotationEndTime && (
                <div className="bs-Fieldset-row">
                    <label className="bs-Fieldset-label">
                        <b>On-Call Duty End Time</b>
                    </label>
                    <div className="bs-Fieldset-fields labelfield">
                        {'This is the only team in this escalation policy.'}{' '}
                        <br /> {"It'll always be active."}
                    </div>
                </div>
            )}

            {((isNextActiveTeam && teamMembersOnPartialDutyCount > 0) ||
                isActiveTeam) && (
                <div className="bs-Fieldset-row">
                    <label className="bs-Fieldset-label">
                        <b id="onCallDutyNote">Note:</b>{' '}
                    </label>
                    <div className="bs-Fieldset-fields labelfield">
                        {hasNextEscalationPolicy && isActiveTeam && (
                            <span>
                                If the current active team does not respond,
                                then the incident will be escalated to
                                Escalation Policy{' '}
                                {currentEscalationPolicyCount + 1} <br />
                                <br />
                            </span>
                        )}
                        {teamMembers &&
                            teamMembers.filter(member => {
                                return (
                                    member.startTime &&
                                    member.startTime !== '' &&
                                    member.endTime &&
                                    member.endTime !== ''
                                );
                            }).length > 0 && (
                                <span>
                                    {' '}
                                    Team Members: <br />
                                    <br />{' '}
                                </span>
                            )}
                        {teamMembers &&
                            teamMembers
                                .filter(member => {
                                    return (
                                        member.startTime &&
                                        member.startTime !== '' &&
                                        member.endTime &&
                                        member.endTime !== ''
                                    );
                                })
                                .map(member => {
                                    let membersFromList = teamMemberList
                                        .concat(groupList || [])
                                        .filter(memberFromList => {
                                            return (
                                                memberFromList.userId ===
                                                    member.userId ||
                                                memberFromList._id ===
                                                    member.groupId
                                            );
                                        });

                                    if (membersFromList.length > 0) {
                                        membersFromList = membersFromList[0];
                                    }

                                    return (
                                        <div
                                            key={membersFromList._id}
                                            className="Box-root Margin-right--16 pointer"
                                        >
                                            <img
                                                src={
                                                    member.groupId
                                                        ? '/dashboard/assets/img/group-image.png'
                                                        : '/dashboard/assets/img/profile-user.svg'
                                                }
                                                className="userIcon"
                                                alt=""
                                            />
                                            <span>
                                                {membersFromList.name ||
                                                    membersFromList.email}
                                            </span>
                                            <span>
                                                {' '}
                                                <br />
                                                <br /> Will only be active from{' '}
                                                {moment(
                                                    moment(
                                                        member.startTime
                                                    ).format('HH:mm'),
                                                    'HH:mm'
                                                ).format('hh:mm A')}{' '}
                                                and{' '}
                                                {moment(
                                                    moment(
                                                        member.endTime
                                                    ).format('HH:mm'),
                                                    'HH:mm'
                                                ).format('hh:mm A')}{' '}
                                                everyday. <br />
                                                <br />
                                            </span>
                                            {isActiveTeam && (
                                                <>
                                                    <span>
                                                        <b>Important: </b>If
                                                        there&#39;s no team
                                                        member on-duty when this
                                                        member is not on-duty
                                                        the incident is at the
                                                        risk of being{' '}
                                                        {hasNextEscalationPolicy
                                                            ? 'escalated'
                                                            : 'ignored'}
                                                        . <br /> <br />
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                        {isActiveTeam && (
                            <>
                                <div>
                                    <p>
                                        <b>Reminders: </b>
                                        {escalation.call && (
                                            <span>
                                                {escalation.callReminders} Call
                                                reminders
                                            </span>
                                        )}{' '}
                                        {escalation.call && escalation.sms && (
                                            <span>,</span>
                                        )}{' '}
                                        {escalation.sms && (
                                            <span>
                                                {escalation.smsReminders} SMS
                                                reminders
                                            </span>
                                        )}{' '}
                                        {(escalation.sms || escalation.call) &&
                                            escalation.email && (
                                                <span>,</span>
                                            )}{' '}
                                        {escalation.email && (
                                            <span>
                                                {escalation.emailReminders}{' '}
                                                Email reminders
                                            </span>
                                        )}{' '}
                                        {(escalation.sms ||
                                            escalation.call ||
                                            escalation.email) && (
                                            <span>,</span>
                                        )}{' '}
                                        {escalation.push && (
                                            <span>
                                                {escalation.pushReminders} Push
                                                Notification reminders
                                            </span>
                                        )}{' '}
                                        <span>
                                            {' '}
                                            will be sent to each member of this
                                            team if they do not respond. <br />
                                        </span>
                                    </p>
                                </div>
                                {hasNextEscalationPolicy && (
                                    <span>
                                        <br />
                                        <b>Information: </b>If they do not
                                        respond. The inident will be escalated
                                        to escalation policy{' '}
                                        {currentEscalationPolicyCount + 1}{' '}
                                        <br />
                                    </span>
                                )}
                                {!hasNextEscalationPolicy && (
                                    <span>
                                        {' '}
                                        <br />
                                        <b>
                                            <span className="red">Alert:</span>{' '}
                                        </b>
                                        If they do not respond. Then the
                                        incident is at the risk of being
                                        ignored. <br />
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

EscalationSummarySingle.displayName = 'EscalationSummarySingle';

EscalationSummarySingle.propTypes = {
    isActiveTeam: PropTypes.bool.isRequired,
    isNextActiveTeam: PropTypes.bool.isRequired,
    teamMemberList: PropTypes.array.isRequired,
    groups: PropTypes.array,
    escalation: PropTypes.object.isRequired,
    hasNextEscalationPolicy: PropTypes.bool.isRequired,
    currentEscalationPolicyCount: PropTypes.number.isRequired,
};

export default EscalationSummarySingle;
