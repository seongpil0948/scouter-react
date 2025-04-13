import React, { useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, useDraggable } from '@heroui/modal';

export function ModalBlushHelp(p: { disclosureHelper: ReturnType<typeof useDisclosure> }) {
  const targetRef = useRef<any>(null);
  const { isOpen, onOpen, onOpenChange } = p.disclosureHelper;
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

  return (
    <>
      <Modal ref={targetRef} isOpen={isOpen} onOpenChange={onOpenChange} size="lg" className="z-50">
        <ModalContent>
          <>
            <ModalHeader {...moveProps} className="flex flex-col gap-1">
              <p className="font-medium mb-1">트레이스 선택 방법</p>
            </ModalHeader>
            <ModalBody>
              <div className="py-4">
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    툴박스에서 <span className="font-semibold">사각형 선택</span> 아이콘을 클릭하세요
                  </li>
                  <li>차트 영역에서 마우스로 드래그하여 데이터 포인트를 선택하세요</li>
                  <li>선택된 트레이스가 아래 표에 표시됩니다</li>
                </ol>
                <div className="flex items-center mt-2 bg-blue-50 dark:bg-blue-900/30 p-1 rounded">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <p className="text-blue-700 dark:text-blue-300">여러 영역을 선택하려면 Shift 키를 누른 상태에서 드래그하세요</p>
                </div>
              </div>
            </ModalBody>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ModalBlushHelp;
