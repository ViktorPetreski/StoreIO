import {Modal, Button, Layout} from 'antd';
import React, {Component} from 'react';
import KeyboardEventHandler from "react-keyboard-event-handler";

class ModalPopup extends Component {
    state = {visible: false};

    showModal = () => {
        this.setState({
            visible: true,
        });
    };


    handleCancel = (e) => {
        this.setState({
            visible: false,
        });
    };

    render() {
        const {isButton, content, title, type, icon} = this.props;
        const style = {
            display: 'inline-block',
            padding: 0,
        };
        const button = <Button style={icon ? style : {marginBottom: 15}} type={type || 'primary'} onClick={this.showModal}
                               icon={icon? null : "plus-circle"}>{title}</Button>;
        const link = <Button id="modal-button" type={"link"} onClick={this.showModal}>{title}</Button>;
        return (
            <React.Fragment>
                {isButton ? button : link}
                <Modal
                    title={title}
                    visible={this.state.visible}
                    centered
                    onCancel={this.handleCancel}
                    width={this.props.width || 500}
                    footer={null}
                >
                    {content}
                </Modal>
            </React.Fragment>
        );
    }
}

export default ModalPopup