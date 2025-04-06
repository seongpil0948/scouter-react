PostgreSQL의 `jsonb` 타입을 쿼리하고 인덱싱하는 방법을 설명하겠습니다. 아래에서 쿼리와 인덱싱 방법을 단계별로 자세히 다루겠습니다.

---

### **1. jsonb 쿼리 방법**

`jsonb`는 PostgreSQL에서 제공하는 JSON 데이터의 바이너리 형태로, 효율적인 쿼리와 인덱싱을 지원합니다. `jsonb` 데이터를 쿼리하려면 다양한 연산자를 사용해 값을 추출하거나 필터링할 수 있습니다. 주요 연산자와 사용 예시는 다음과 같습니다:

#### **(1) 기본 값 추출**

- **`->`**: JSON 객체에서 특정 키의 값을 `jsonb` 형태로 반환합니다.
  - 예: `SELECT data->'name' FROM mytable;`  
    → `"John"` (jsonb 형식)
- **`->>`**: JSON 객체에서 특정 키의 값을 텍스트로 반환합니다.
  - 예: `SELECT data->>'name' FROM mytable;`  
    → `John` (텍스트 형식)
  - 필터링 예: `SELECT * FROM mytable WHERE data->>'name' = 'John';`

#### **(2) 중첩된 JSON 쿼리**

- 중첩된 키에 접근하려면 연산자를 연결하거나 경로를 지정합니다.
  - **연산자 연결**: `data->'address'->>'city'`
    - 예: `SELECT data->'address'->>'city' FROM mytable;`  
      → `Seoul` (텍스트)
  - **`#>`**: 경로를 배열로 지정해 `jsonb` 값을 반환합니다.
    - 예: `SELECT data #> '{address, city}' FROM mytable;`  
      → `"Seoul"` (jsonb)
  - **`#>>`**: 경로를 배열로 지정해 텍스트 값을 반환합니다.
    - 예: `SELECT data #>> '{address, city}' FROM mytable;`  
      → `Seoul` (텍스트)

#### **(3) 배열 쿼리**

- JSON 내 배열(예: `"tags": ["sometag", "anothertag"]`)을 쿼리할 때:
  - **`?`**: 배열이 특정 값을 포함하는지 확인합니다.
    - 예: `SELECT * FROM mytable WHERE (data->'tags') ? 'sometag';`  
      → `"tags"` 배열에 `"sometag"`가 있으면 true
  - **`@>`**: JSON 객체가 특정 키-값 쌍을 포함하는지 확인합니다.
    - 예: `SELECT * FROM mytable WHERE data @> '{"tags": ["sometag"]}';`  
      → `"tags"` 배열에 `"sometag"`가 포함된 경우 true

#### **주요 연산자 요약**

| 연산자 | 용도                           | 반환 타입 |
| ------ | ------------------------------ | --------- |
| `->`   | 키로 값 추출                   | jsonb     |
| `->>`  | 키로 텍스트 값 추출            | text      |
| `#>`   | 경로로 값 추출                 | jsonb     |
| `#>>`  | 경로로 텍스트 값 추출          | text      |
| `@>`   | 포함 여부 확인                 | boolean   |
| `?`    | 키 존재 또는 배열 값 포함 확인 | boolean   |

---

### **2. jsonb 인덱싱 방법**

`jsonb` 쿼리의 성능을 개선하려면 적절한 인덱스를 생성해야 합니다. PostgreSQL은 `GIN`과 `BTREE` 인덱스를 지원하며, 사용 사례에 따라 적합한 인덱스를 선택합니다.

#### **(1) GIN 인덱스**

- **용도**: `jsonb` 컬럼 전체를 인덱싱해 `@>`, `?` 같은 연산자를 사용하는 쿼리를 최적화합니다.
- **생성 예시**:
  ```sql
  CREATE INDEX idx ON mytable USING GIN (data);
  ```
- **적합한 쿼리**:
  - `WHERE data @> '{"name": "John"}';`
  - `WHERE (data->'tags') ? 'sometag';`
- **특징**: JSON 내 모든 키와 값을 인덱싱하므로 유연성이 높습니다.

#### **(2) BTREE 인덱스**

- **용도**: 특정 키의 값을 추출한 결과에 대한 동등 비교(`=`)나 범위 쿼리(`>`, `<`)를 최적화합니다.
- **생성 예시**:
  ```sql
  CREATE INDEX idx ON mytable ((data->>'name'));
  ```
  - 숫자 값의 경우: `CREATE INDEX idx ON mytable (((data->>'age')::int));`
- **적합한 쿼리**:
  - `WHERE data->>'name' = 'John';`
  - `WHERE (data->>'age')::int > 30;`
- **특징**: 특정 키에 대한 쿼리에 특화되어 있습니다.

#### **(3) 중첩 키 또는 배열 인덱싱**

- **중첩 키**:
  ```sql
  CREATE INDEX idx ON mytable ((data->'address'->>'city'));
  ```
- **배열**:
  ```sql
  CREATE INDEX idx ON mytable USING GIN ((data->'tags'));
  ```
  - `jsonb_path_ops` 사용 가능: `USING GIN ((data->'tags') jsonb_path_ops);`
  - 배열 요소 포함 쿼리(`?`, `@>`)에 유용합니다.

#### **인덱스 선택 가이드**

- **GIN**: 일반적인 `jsonb` 쿼리(포함, 존재 여부)에 적합.
- **BTREE**: 특정 키의 값에 대한 정확한 비교나 정렬이 필요한 경우.
- **복합 인덱스**: 여러 키를 자주 쿼리한다면 `(data->>'name', (data->>'age')::int)` 같은 복합 BTREE 인덱스도 가능.

---

### **결론**

- **쿼리**: `->`, `->>`, `#>`, `#>>`, `@>`, `?` 연산자를 사용해 `jsonb` 데이터를 추출하고 필터링하세요.
- **인덱싱**: GIN 인덱스로 전체 `jsonb` 컬럼을 커버하거나, BTREE 인덱스로 특정 키의 쿼리를 최적화하세요.

위 방법들을 사용하면 PostgreSQL에서 `jsonb` 데이터를 효율적으로 쿼리하고 성능을 높일 수 있습니다. 쿼리 패턴에 따라 적절한 연산자와 인덱스를 선택하는 것이 중요합니다!
