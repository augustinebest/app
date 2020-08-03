import React, { Component } from 'react';
import moment from 'moment';
import Slide from 'react-reveal/Slide';
import { PropTypes } from 'prop-types';
import { logEvent } from '../../analytics';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import { bindActionCreators } from 'redux';
import { markAsRead } from '../../actions/notification';
import { connect } from 'react-redux';
import { history } from '../../store';

class IncidentCreated extends Component {
    markAsRead(notification) {
        const {
            projectId,
            _id: notificationId,
            meta: { componentId, incidentId },
        } = notification;
        this.props.markAsRead(projectId, notificationId);
        if (SHOULD_LOG_ANALYTICS) {
            logEvent('EVENT: DASHBOARD > NOTIFICATION MARKED AS READ', {});
        }
        history.push(
            `/dashboard/project/${projectId}/${componentId}/incidents/${incidentId}`
        );
    }

    render() {
        const { notifications } = this.props;

        return (
            <Slide bottom>
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        zIndex: 1,
                        margin: '0 30px 20px 0',
                    }}
                >
                    <div
                        className="Box-root"
                        id="notificationscroll"
                        style={{
                            width: '450px',
                            maxHeight: '350px',
                            overflowX: 'scroll',
                        }}
                    >
                        <div className="Box-root Padding-all--4">
                            <div
                                className="Box-root"
                                style={{
                                    fontWeight: '500',
                                }}
                            >
                                {notifications && notifications.length > 0
                                    ? notifications.map(
                                          (notification, index) => {
                                              return (
                                                  <div
                                                      className="Box-root Box-background--red4"
                                                      style={{
                                                          padding: '10px 10px',
                                                          fontWeight: '400',
                                                          fontSize: '1em',
                                                          marginBottom: '4px',
                                                          borderRadius: '4px',
                                                      }}
                                                      key={notification._id}
                                                  >
                                                      <div className="Notify-fyipe">
                                                          <div className="Notify-fyipe-container-row-primary db-SideNav-icon--danger" />
                                                          <span className="Notify-fyipe-container-row-secondary Text-color--white">
                                                              {
                                                                  notification.message
                                                              }{' '}
                                                              on{' '}
                                                              {moment(
                                                                  notification.createdAt
                                                              ).format(
                                                                  'MMMM Do YYYY, h:mm a'
                                                              )}
                                                          </span>
                                                      </div>
                                                      <div className="Notify-fyipe">
                                                          <span></span>
                                                          <span>
                                                              <button
                                                                  id={`viewIncident-${index}`}
                                                                  className="bs-Button bs-Button--red Box-background--red border-white"
                                                                  style={{
                                                                      height:
                                                                          '30px',
                                                                      width:
                                                                          '50px',
                                                                      boxShadow:
                                                                          '0 0 0 1px #ffffff, 0 1.5px 1px 0 rgba(158, 33, 70, 0.15), 0 2px 5px 0 rgba(50, 50, 93, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.08), 0 0 0 0 transparent',
                                                                      float:
                                                                          'right',
                                                                      marginRight:
                                                                          '5px',
                                                                  }}
                                                                  onClick={() =>
                                                                      this.markAsRead(
                                                                          notification
                                                                      )
                                                                  }
                                                                  type="button"
                                                              >
                                                                  <span>
                                                                      View
                                                                  </span>
                                                              </button>
                                                          </span>
                                                      </div>
                                                  </div>
                                              );
                                          }
                                      )
                                    : null}
                            </div>
                        </div>
                    </div>
                </div>
            </Slide>
        );
    }
}

IncidentCreated.displayName = 'IncidentCreated';

const mapStateToProps = () => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ markAsRead }, dispatch);
};

IncidentCreated.propTypes = {
    notifications: PropTypes.array,
    markAsRead: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(IncidentCreated);