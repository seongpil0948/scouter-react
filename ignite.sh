#!/bin/bash

# 컨테이너 이름 설정
CONTAINER_NAME="scouter-react"
IMAGE_NAME="scouter-react"
PORT="3000"

# 색상 설정
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting ${CONTAINER_NAME} deployment script...${NC}"

# 1. 기존 컨테이너 확인 및 삭제
echo -e "${YELLOW}Checking for existing ${CONTAINER_NAME} container...${NC}"
if [ "$(docker ps -a -q -f name=${CONTAINER_NAME})" ]; then
    echo -e "${YELLOW}Found existing container. Stopping and removing...${NC}"
    docker stop ${CONTAINER_NAME}
    docker rm ${CONTAINER_NAME}
    echo -e "${GREEN}Existing container removed.${NC}"
else
    echo -e "${GREEN}No existing container found.${NC}"
fi

# 2. 이미지 확인
echo -e "${YELLOW}Checking for ${IMAGE_NAME} image...${NC}"
if [[ "$(docker images -q ${IMAGE_NAME} 2> /dev/null)" == "" ]]; then
    echo -e "${RED}Image ${IMAGE_NAME} not found! Building image first...${NC}"
    docker build -t ${IMAGE_NAME} .
    
    # 빌드 실패 시 종료
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to build image. Exiting.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Image built successfully.${NC}"
fi

# 3. 컨테이너 실행
echo -e "${YELLOW}Starting new ${CONTAINER_NAME} container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:3000 \
    --restart unless-stopped \
    ${IMAGE_NAME}

# 4. 컨테이너 실행 확인
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Container ${CONTAINER_NAME} started successfully!${NC}"
    echo -e "${GREEN}Application is running at http://localhost:${PORT}${NC}"
    
    # 컨테이너 정보 출력
    echo -e "${YELLOW}Container information:${NC}"
    docker ps -f name=${CONTAINER_NAME}
else
    echo -e "${RED}Failed to start container. Please check logs.${NC}"
    exit 1
fi