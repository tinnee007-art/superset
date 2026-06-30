/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import Mousetrap from 'mousetrap';
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { throttle } from 'lodash';
import {
  LOCALSTORAGE_MAX_USAGE_KB,
  LOCALSTORAGE_WARNING_THRESHOLD,
  LOCALSTORAGE_WARNING_MESSAGE_THROTTLE_MS,
} from 'src/SqlLab/constants';
import { addDangerToast } from 'src/components/MessageToasts/actions';
import type { SqlLabRootState } from 'src/SqlLab/types';
import { logEvent } from 'src/logger/actions';
import {
  LOG_ACTIONS_SQLLAB_WARN_LOCAL_STORAGE_USAGE,
  LOG_ACTIONS_SQLLAB_MONITOR_LOCAL_STORAGE_USAGE,
} from 'src/logger/LogUtils';
import TabbedSqlEditors from '../TabbedSqlEditors';
import QueryAutoRefresh from '../QueryAutoRefresh';
import PopEditorTab from '../PopEditorTab';
import AppLayout from '../AppLayout';
import AiChatWindow from 'src/features/aiAssistant/components/AiChatWindow';


import {
  addQueryEditor,
  runQuery,
  queryEditorSetSql,
} from 'src/SqlLab/actions/sqlLab';



const SqlLabStyles = styled.div`
  ${({ theme }) => css`
    &.SqlLab {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      padding: 0;

      pre:not(.code) {
        padding: 0 !important;
        margin: 0;
        border: none;
        font-size: ${theme.fontSizeSM}px;
        background: transparent !important;
      }

      .north-pane {
        display: flex;
        flex-direction: column;
      }

      .ace_editor {
        flex-grow: 1;
      }

      .ace_content {
        height: 100%;
      }

      .ant-tabs-content-holder {
        /* This is needed for Safari */
        height: 100%;
      }

      .ant-tabs-content {
        height: 100%;
        position: relative;
        background-color: ${theme.colorBgContainer};
        overflow-x: auto;
        overflow-y: auto;

        > .ant-tabs-tabpane {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
      }

      .ResultsModal .ant-modal-body {
        min-height: ${theme.sizeUnit * 140}px;
      }

      .ant-modal-body {
        overflow: auto;
      }
    }
  `};
`;

type PureProps = {
  // add this for testing componentDidUpdate spec
  updated?: boolean;
};

type AppProps = ReturnType<typeof mergeProps> & PureProps;

interface AppState {
  hash: string;
}

class App extends PureComponent<AppProps, AppState> {
  hasLoggedLocalStorageUsage!: boolean;

  private boundOnHashChanged: () => void;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      hash: window.location.hash,
    };

    this.boundOnHashChanged = this.onHashChanged.bind(this);

    this.showLocalStorageUsageWarning = throttle(
      this.showLocalStorageUsageWarning,
      LOCALSTORAGE_WARNING_MESSAGE_THROTTLE_MS,
      { trailing: false },
    );
  }

  handleAiRunSql = (event: any) => {
    try {
      // ✅ Extract both the sql and the new callback function
      const { sql, onTabCreated } = event.detail || {};
      if (!sql) return;

      const { actions, sqlLab } = this.props as any;

      const editors = sqlLab?.queryEditors || [];
      const tabHistory = sqlLab?.tabHistory || [];

      const activeEditorId = tabHistory[tabHistory.length - 1];
      let activeEditor = editors.find((e: any) => e.id === activeEditorId);

      if (!activeEditor && editors.length > 0) {
        activeEditor = editors[0];
      }

      const targetDbId = activeEditor?.dbId || activeEditor?.databaseId;
      const targetSchema = activeEditor?.schema;

      if (!targetDbId) return;

      let maxAiQueryNum = 0;
      editors.forEach((editor: any) => {
        const tabTitle = editor.name || editor.title || '';
        const match = tabTitle.match(/^AI Generated Query(?:\s+(\d+))?$/);
        if (match) {
          const num = match[1] ? parseInt(match[1], 10) : 1;
          if (num > maxAiQueryNum) {
            maxAiQueryNum = num;
          }
        }
      });
      
      const nextAiQueryNum = maxAiQueryNum + 1;
      const dynamicTabName = `AI Generated Query ${nextAiQueryNum}`;

      actions.addQueryEditor({
        name: dynamicTabName,        
        title: dynamicTabName,       
        dbId: targetDbId,
        schema: targetSchema || null,
        sql: sql,                    
        autorun: true,               
      });

      // ✅ Trigger the chat window callback with the exact name so it knows!
      if (typeof onTabCreated === 'function') {
        onTabCreated(dynamicTabName);
      }

      setTimeout(() => {
        const { sqlLab: updatedSqlLab } = this.props as any;
        const updatedEditors = updatedSqlLab?.queryEditors || [];
        if (!updatedEditors.length) return;

        const latestEditor = updatedEditors[updatedEditors.length - 1];

        if (latestEditor) {
          actions.queryEditorSetSql(latestEditor, sql);
          actions.runQuery(latestEditor);
        }
      }, 500);

    } catch (err) {
      console.error('AI SQL listener error', err);
    }
  };

  componentDidMount() {
    window.addEventListener('hashchange', this.boundOnHashChanged);

    // Horrible hack to disable side swipe navigation when in SQL Lab. Even though the
    // docs say setting this style on any div will prevent it, turns out it only works
    // when set on the body element.
    document.body.style.overscrollBehaviorX = 'none';
    window.addEventListener('ai-run-sql', this.handleAiRunSql);
  }

  componentDidUpdate() {
    const { localStorageUsageInKilobytes, actions, queries } = this.props;
    const queryCount = Object.keys(queries || {}).length || 0;
    if (
      localStorageUsageInKilobytes >=
      LOCALSTORAGE_WARNING_THRESHOLD * LOCALSTORAGE_MAX_USAGE_KB
    ) {
      this.showLocalStorageUsageWarning(
        localStorageUsageInKilobytes,
        queryCount,
      );
    }
    if (localStorageUsageInKilobytes > 0 && !this.hasLoggedLocalStorageUsage) {
      const eventData = {
        current_usage: localStorageUsageInKilobytes,
        query_count: queryCount,
      };
      actions.logEvent(
        LOG_ACTIONS_SQLLAB_MONITOR_LOCAL_STORAGE_USAGE,
        eventData,
      );
      this.hasLoggedLocalStorageUsage = true;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.boundOnHashChanged);

    // And now we need to reset the overscroll behavior back to the default.
    document.body.style.overscrollBehaviorX = 'auto';

    Mousetrap.reset();
    window.removeEventListener('ai-run-sql', this.handleAiRunSql);
  }

  onHashChanged() {
    this.setState({ hash: window.location.hash });
  }

  showLocalStorageUsageWarning(currentUsage: number, queryCount: number) {
    this.props.actions.addDangerToast(
      t(
        "SQL Lab uses your browser's local storage to store queries and results." +
          '\nCurrently, you are using %(currentUsage)s KB out of %(maxStorage)d KB storage space.' +
          '\nTo keep SQL Lab from crashing, please delete some query tabs.' +
          '\nYou can re-access these queries by using the Save feature before you delete the tab.' +
          '\nNote that you will need to close other SQL Lab windows before you do this.',
        {
          currentUsage: currentUsage.toFixed(2),
          maxStorage: LOCALSTORAGE_MAX_USAGE_KB,
        },
      ),
    );
    const eventData = {
      current_usage: currentUsage,
      query_count: queryCount,
    };
    this.props.actions.logEvent(
      LOG_ACTIONS_SQLLAB_WARN_LOCAL_STORAGE_USAGE,
      eventData,
    );
  }

  render() {
    const { queries, queriesLastUpdate } = this.props;
    if (this.state.hash && this.state.hash === '#search') {
      return (
        <Redirect
          to={{
            pathname: '/sqllab/history/',
          }}
        />
      );
    }
    return (
      <SqlLabStyles data-test="SqlLabApp" className="App SqlLab">
        <QueryAutoRefresh
          queries={queries}
          queriesLastUpdate={queriesLastUpdate}
        />

        {/* ✅ Split layout (Editor + AI Panel) */}
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* ✅ Left: SQL Editor */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0, // ✅ IMPORTANT: prevents layout overflow
            }}
          >
            <PopEditorTab>
              <AppLayout>
                <TabbedSqlEditors />
              </AppLayout>
            </PopEditorTab>
          </div>

          {/* ✅ Right: AI Assistant Panel (NO OVERLAY) */}
          <div
            style={{
              display: 'flex',
              height: '100%',
            }}
          >
            <AiChatWindow />
          </div>
        </div>
      </SqlLabStyles>
    );
  }
}

function mapStateToProps(state: SqlLabRootState) {
  const { common, localStorageUsageInKilobytes, sqlLab } = state;
  return {
    common,
    localStorageUsageInKilobytes,
    queries: sqlLab?.queries,
    queriesLastUpdate: sqlLab?.queriesLastUpdate,
    sqlLab,
  };
}

const mapDispatchToProps = {
  addDangerToast,
  logEvent,

  addQueryEditor,
  runQuery,
  queryEditorSetSql,

};

function mergeProps(
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: typeof mapDispatchToProps,
  state: PureProps,
) {
  return {
    ...state,
    ...stateProps,
    actions: dispatchProps,
  };
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(App);
