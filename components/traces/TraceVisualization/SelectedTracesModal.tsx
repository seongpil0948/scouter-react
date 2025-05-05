import React, { useRef } from "react";
import { Button } from "@heroui/button";
import { X } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDraggable,
} from "@heroui/modal";
import SelectedTracesTable from "./SelectedTracesTable"; // 기존 컴포넌트 재사용

interface SelectedTracesModalProps {
  selectedTraces: SelectedTraceData[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearSelection: () => void;
  onViewDetails?: (traceId: string) => void;
}

const SelectedTracesModal: React.FC<SelectedTracesModalProps> = ({
  selectedTraces,
  isOpen,
  onOpenChange,
  onClearSelection,
  onViewDetails,
}) => {
  const targetRef = useRef<any>(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

  // 선택 해제 및 모달 닫기
  const handleClearAndClose = () => {
    onClearSelection();
    onOpenChange(false);
  };

  return (
    <Modal
      ref={targetRef}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
      classNames={{
        base: "z-50",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader
              {...moveProps}
              className="flex justify-between items-center p-4  "
            >
              <div className="flex items-center">
                <h3 className="text-base font-medium">
                  선택된 트레이스 ({selectedTraces.length}개)
                </h3>
              </div>
            </ModalHeader>
            <ModalBody className="p-0 max-h-[30vh] overflow-auto">
              <SelectedTracesTable
                selectedTraces={selectedTraces}
                onClearSelection={onClearSelection}
                onViewDetails={onViewDetails}
                className="border-0 shadow-none"
              />
            </ModalBody>
            <ModalFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                선택된 트레이스: {selectedTraces.length}개
              </div>
              <Button color="primary" onPress={() => onOpenChange(false)}>
                닫기
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SelectedTracesModal;
