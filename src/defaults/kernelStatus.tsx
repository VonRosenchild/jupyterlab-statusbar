import * as ReactDOM from 'react-dom';
import * as React from 'react';

import { JupyterLabPlugin, JupyterLab } from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';

import { IDefaultStatusesManager } from './manager';

import { Widget } from '@phosphor/widgets';

import { IConsoleTracker, ConsolePanel } from '@jupyterlab/console';
import { IClientSession } from '@jupyterlab/apputils';

export namespace StatusComponent {
    export interface IState {
        kernelStatus: string;
        kernelType: string;
    }
    export interface IProps {
        notebookTracker: INotebookTracker;
        consoleTracker: IConsoleTracker;
    }
}

export class StatusComponent extends React.Component<
    StatusComponent.IProps,
    StatusComponent.IState
> {
    state = {
        kernelStatus: '',
        kernelType: ''
    };
    constructor(props: StatusComponent.IProps) {
        super(props);
        this.props.notebookTracker.currentChanged.connect(this.cellChanged);
        this.props.notebookTracker.activeCellChanged.connect(this.cellChanged);
        this.props.consoleTracker.currentChanged.connect(this.consoleChanged);
    }

    consoleChanged = (tracker: IConsoleTracker, consolePanel: ConsolePanel) => {
        if (consolePanel.session.kernel) {
            this.setState({
                kernelStatus: consolePanel.session.kernel.status,
                kernelType: consolePanel.session.kernel.name
            });
            consolePanel.session.statusChanged.connect(this.kernelChanged);
            consolePanel.session.kernelChanged.connect(this.kernelChanged);
        }
    };
    cellChanged = (tracker: INotebookTracker) => {
        const currentWidget = tracker.currentWidget;
        if (currentWidget && currentWidget.session.kernel) {
            this.setState({
                kernelStatus: currentWidget.session.kernel.status,
                kernelType: currentWidget.session.kernel.name
            });
            currentWidget.session.statusChanged.connect(this.kernelChanged);
            currentWidget.session.kernelChanged.connect(this.kernelChanged);
        }
    };

    kernelChanged = (session: IClientSession) => {
        if (session.kernel) {
            this.setState({
                kernelStatus: session.kernel.status,
                kernelType: session.kernel.name
            });
        } else {
            this.setState({ kernelStatus: 'dead' });
        }
    };

    render() {
        return (
            <div>
                {' '}
                {this.state.kernelType} | {this.state.kernelStatus}{' '}
            </div>
        );
    }
}

export class KernelStatus extends Widget {
    constructor(opts: KernelStatus.IOptions) {
        super();
        this._notebookTracker = opts.notebookTracker;
        this._consoleTracker = opts.consoleTracker;
    }
    onBeforeAttach() {
        ReactDOM.render(
            <StatusComponent
                notebookTracker={this._notebookTracker}
                consoleTracker={this._consoleTracker}
            />,
            this.node
        );
    }

    private _notebookTracker: INotebookTracker;
    private _consoleTracker: IConsoleTracker;
}

/*
 * Initialization data for the statusbar extension.
 */

export const kernelStatusItem: JupyterLabPlugin<void> = {
    id: 'jupyterlab-statusbar/default-items:kernel-status',
    autoStart: true,
    requires: [IDefaultStatusesManager, INotebookTracker, IConsoleTracker],
    activate: (
        app: JupyterLab,
        manager: IDefaultStatusesManager,
        notebookTracker: INotebookTracker,
        consoleTracker: IConsoleTracker
    ) => {
        manager.addDefaultStatus(
            'kernel-status-item',
            new KernelStatus({ notebookTracker, consoleTracker }),
            { align: 'left', priority: 0 }
        );
    }
};

export namespace KernelStatus {
    /**
     * Options for creating a new StatusBar instance
     */
    export interface IOptions {
        notebookTracker: INotebookTracker;
        consoleTracker: IConsoleTracker;
    }
}