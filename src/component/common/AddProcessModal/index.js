import React, { useState } from 'react';
import Modal from '../Modal';
import InputElement from '../InputElement';
import Button from '../Button';

const AddProcessModal = ({ isOpen, onClose, onAddProcess, isLoading = false }) => {
    const [processName, setProcessName] = useState('');
    const [needsMachine, setNeedsMachine] = useState(false);
    /** 'single' | 'sendReceive' */
    const [processFlow, setProcessFlow] = useState('single');
    const [error, setError] = useState('');

    const validateProcessName = (name) => {
        if (!name.trim()) {
            return 'Process name is required';
        }
        return '';
    };

    const handleAddProcess = () => {
        const validationError = validateProcessName(processName);
        if (validationError) {
            setError(validationError);
            return;
        }

        onAddProcess({
            processName,
            needsMachine,
            hasSendReceive: processFlow === 'sendReceive',
        });
        setProcessName('');
        setNeedsMachine(false);
        setProcessFlow('single');
        setError('');
        onClose();
    };

    const handleInputChange = (value) => {
        setProcessName(value);
        if (error) {
            setError('');
        }
    };

    const footerContent = (
        <div className="flex gap-3 justify-end">
            <Button
                type="button"
                variant="default"
                label="Cancel"
                className='focus:!ring-0'
                onClick={onClose}
                disabled={isLoading}
            />
            <Button
                type="button"
                variant="primary"
                label={isLoading ? 'Adding...' : 'Add New Process'}
                onClick={handleAddProcess}
                disabled={isLoading}
                loading={isLoading}
            />
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Process"
            footerContent={footerContent}
            size="md"
        >
            <div className="p-4 space-y-4">
                <InputElement
                    name="Process Name"
                    placeholder="Enter process name"
                    value={processName}
                    onChange={handleInputChange}
                    is_required={true}
                    error={error}
                />

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                        Process type <span className="text-red-500">*</span>
                    </p>
                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                            type="radio"
                            name="processFlow"
                            checked={processFlow === 'single'}
                            onChange={() => setProcessFlow('single')}
                            className="mt-1 h-4 w-4"
                        />
                        <span>
                            <span className="font-medium">Single process</span>
                            <span className="block text-gray-500 text-xs">
                                One scan completes this step (like Press / Logo).
                            </span>
                        </span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                            type="radio"
                            name="processFlow"
                            checked={processFlow === 'sendReceive'}
                            onChange={() => setProcessFlow('sendReceive')}
                            className="mt-1 h-4 w-4"
                        />
                        <span>
                            <span className="font-medium">Send / Receive</span>
                            <span className="block text-gray-500 text-xs">
                                Same as Doracut: Send first, then Receive (or Single).
                            </span>
                        </span>
                    </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={needsMachine}
                        onChange={(e) => setNeedsMachine(e.target.checked)}
                        className="h-4 w-4"
                    />
                    Needs machine (scan will pick employee per machine)
                </label>
            </div>
        </Modal>
    );
};

export default AddProcessModal;
