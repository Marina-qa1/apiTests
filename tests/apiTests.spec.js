import { test, expect } from "@playwright/test";

let token;


test.describe("Challenge", () => {
  test.beforeAll(async ({ request }, testinfo) => {
    let r = await request.post(`${testinfo.project.use.apiURL}/challenger`); // указываем метод
    const headers = r.headers();
    console.log(`${testinfo.project.use.apiURL}${headers.location}`);
    token = headers["x-challenger"];
  });


  test(" 02 GET получить токен ", { tag: '@API' }, async ({ request }, testinfo) => {
    let r = await request.get(`${testinfo.project.use.apiURL}/challenges`, {
      headers: { "x-challenger": token },
    });
    const body = await r.json();
    expect(body.challenges.length).toBe(59);
  });


  test(" 03 GET /todos - вернуть список задач ",{ tag: '@API' }, async ({ request }, testinfo) => {
    const response = await request.get(`${testinfo.project.use.apiURL}/todos`, {
      headers: { 
        "x-challenger": token,
        "Content-Type": "application/json"
      }
    }); 

     let headers = await response.headers();
     let body = await response.json();

     expect(response.status()).toBe(200);
     expect(response.headers()["content-type"]).toContain("application/json");
     expect(body.todos.length).toBeGreaterThan(0); 

     if (body.todos.length > 0) {
        expect(body.todos[0]).toHaveProperty("id");
        expect(body.todos[0]).toHaveProperty("title");
        expect(body.todos[0]).toHaveProperty("doneStatus");
    }
  });


  test("04 GET /todo (404) not plural",{ tag: '@API' }, async ({ request }, testinfo) => {
    const response = await request.get(`${testinfo.project.use.apiURL}/todo`, {
      headers: { 
        "x-challenger": token,
        "Content-Type": "application/json"
      }
      }); 
     expect(response.status()).toBe(404);
     expect(response.headers()["content-type"]).toContain("application/json");
  });


  test("05 GET /todos/{id} (200)",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await response.json();
  const firstTodoId = body.todos[0].id;

  //Получаем конкретный todo по ID
  const singleResponse = await request.get(`${testinfo.project.use.apiURL}/todos/${firstTodoId}`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 
  const todoData = await singleResponse.json();
  expect(singleResponse.status()).toBe(200);
  expect(singleResponse.headers()["content-type"]).toContain("application/json");
  expect(todoData.todos[0].id).toBe(firstTodoId);
  expect(todoData.todos).toHaveLength(1); // Должен быть ровно один элемент
});


  test("06 GET /todos/{id} (404)",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos/777`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 
 const errorData = await response.json();
     expect(response.status()).toBe(404);
     expect(response.headers()["content-type"]).toContain("application/json");
     expect(errorData).toEqual(expect.any(Object));
  });


  test("07 GET /todos (200) ?filter",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos?doneStatus=true`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 
  const filterData = await response.json();

  // Основные проверки
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(filterData).toHaveProperty('todos');
  expect(Array.isArray(filterData.todos)).toBe(true);
  }); 

    test(" 08 HEAD /todos (200)",{ tag: '@API' }, async ({ request }, testinfo) => {
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
    }
  }); 
  const getHeaders = getResponse.headers();

    //Выполняем HEAD запрос
  const headResponse = await request.head(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token 
    }
  }); 
  const headHeaders = headResponse.headers();
  expect(headResponse.status()).toBe(200);
  
  // Сравнение с GET ответом
  expect(headHeaders["content-type"]).toBe(getHeaders["content-type"]);
  expect(headHeaders["x-challenger"]).toBe(getHeaders["x-challenger"]);
  
  // Проверка наличия X-CHALLENGER заголовка
  expect(headHeaders["x-challenger"]).toBe(token);
    }); 


test("09 POST /todos (201) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const newTodo = {
    title: "Create first POST",
    doneStatus: true,
    description: "API testing"
  };
  
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 
    const createdTodo = await response.json();

  expect(response.status()).toBe(201);
  expect(createdTodo.id).toBeGreaterThan(0);
  expect(createdTodo.title).toBe(newTodo.title);
  expect(createdTodo.doneStatus).toBe(newTodo.doneStatus);
  expect(createdTodo.description).toBe(newTodo.description);

});


test(" 10 POST /todos (400) doneStatus ", { tag: '@API' }, async ({ request }, testinfo) => {
  const newTodo = {
    title: "Create first POST",
    doneStatus: "bob",
    description: "API testing"
  };
  
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 

   const errorMess = await response.json();

   expect(response.status()).toBe(400);
   expect(errorMess).toEqual(expect.any(Object));

});


test(" 11 POST /todos (400) title too long ", { tag: '@API' }, async ({ request }, testinfo) => {
  const newTodo = {
    title: "Create first POST. Issue a POST request to create a todo but fail length validation on the `title` field because your title exceeds maximum allowable characters.",
    doneStatus: true,
    description: "API testing"
  };
  
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 

   const responseBody = await response.json();

   expect(response.status()).toBe(400);
   expect(responseBody).toHaveProperty('errorMessages');
   expect(Array.isArray(responseBody.errorMessages)).toBe(true);
   expect(response.headers()["x-challenger"]).toBe(token);
   expect(responseBody.errorMessages[0]).toBe(
    "Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50"
  );

});


test(" 12 POST /todos (400) description too long ", { tag: '@API' }, async ({ request }, testinfo) => {
  // Создаем описание длиной более 200 символов
  const longDescription = "Should trigger a 400 error because this description is too long and exceeds the maximum length of 200 characters. We should do additional testing to make sure that 200 is valid. And check large strings. This text should be over 200 characters to properly test the validation.";
  
  const newTodo = {
    title: "Create first POST",
    doneStatus: true,
    description: longDescription
  };
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 

   const responseBody = await response.json();
   
   expect(response.status()).toBe(400);
   expect(responseBody).toHaveProperty('errorMessages');
   expect(Array.isArray(responseBody.errorMessages)).toBe(true);
   expect(response.headers()["x-challenger"]).toBe(token);
   expect(responseBody.errorMessages[0]).toBe(
    "Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200"
  );
});


test(" 13 POST /todos (201) max out content ", { tag: '@API' }, async ({ request }, testinfo) => {
    const exactTitle = "A".repeat(50); 
    const exactDescription = "B".repeat(200);
  
    const newTodo = {
    title: exactTitle,
    doneStatus: true,
    description: exactDescription
  };
  
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 
  const responseBody = await response.json();

  expect(response.status()).toBe(201);
  expect(responseBody.id).toBeGreaterThan(0);
  expect(responseBody.title).toBe(exactTitle);
  expect(responseBody.description).toBe(exactDescription);
  expect(responseBody.doneStatus).toBe(true);

});


test(" 14 POST /todos (413) content too long ", { tag: '@API' }, async ({ request }, testinfo) => {
    const exactTitle = "A".repeat(10); 
    const exactDescription = "B".repeat(5000);
  
    const newTodo = {
    title: exactTitle,
    doneStatus: true,
    description: exactDescription
  };
  
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 
  const responseBody = await response.json();

   expect(response.status()).toBe(413);
   expect(responseBody).toHaveProperty('errorMessages');
   expect(Array.isArray(responseBody.errorMessages)).toBe(true);
   expect(response.headers()["x-challenger"]).toBe(token);
   expect(responseBody.errorMessages[0]).toBe(
    "Error: Request body too large, max allowed is 5000 bytes"
  );
});

test(" 15 POST /todos (400) extra ", { tag: '@API' }, async ({ request }, testinfo) => {
  
    const newTodo = {
    title: "Create POST",
    priority:"extra"
  };
  
  const response = await request.post(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(newTodo)
  }); 
  const responseBody = await response.json();

   expect(response.status()).toBe(400);
   expect(responseBody).toHaveProperty('errorMessages');
   expect(Array.isArray(responseBody.errorMessages)).toBe(true);
   expect(response.headers()["x-challenger"]).toBe(token);
   expect(responseBody.errorMessages[0]).toBe(
    "Could not find field: priority"
  );
});


test(" 16 PUT /todos/{id}(400) ", { tag: '@API' }, async ({ request }, testinfo) => {
 
  const notExistId = 888;

  // Создаем полную полезную нагрузку для обновлени
  const updateData = {
    title: `Minimal Update ${Date.now()}`,
    doneStatus: true,
    description: `Updated Description ${Date.now()}`
  };

  // Выполняем PUT запрос с несуществующим ID
  const putResponse = await request.put(`${testinfo.project.use.apiURL}/todos/${notExistId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const responseBody = await putResponse.json();

  expect(putResponse.status()).toBe(400); 
  expect(responseBody).toHaveProperty('errorMessages');
  expect(Array.isArray(responseBody.errorMessages)).toBe(true);
  expect(responseBody.errorMessages.length).toBeGreaterThan(0);

console.log('Error message:', responseBody.errorMessages[0]);
});

test(" 17 POST /todos/{id} (200)", { tag: '@API' }, async ({ request }, testinfo) => {
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { "x-challenger": token }
  }); 
  const todos = await getResponse.json();
  
  // Выбираем первый существующий todo
  const todoId = todos.todos[0].id;
  
  // Данные для обновления
  const updateData = {
    title: "Update POST",
    doneStatus: true,
    description: "description"
  };
 
  const response = await request.post(`${testinfo.project.use.apiURL}/todos/${todoId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const responseBody = await response.json();

  expect(response.status()).toBe(200); 
  expect(responseBody.id).toBe(todoId); 
  expect(responseBody.title).toBe(updateData.title);
  expect(responseBody.doneStatus).toBe(updateData.doneStatus);
  expect(responseBody.description).toBe(updateData.description);
});

test(" 18 POST /todos/{id} (404) ", { tag: '@API' }, async ({ request }, testinfo) => {
  // Создаем несуществующий ID
  const notExistId = Math.floor(Math.random() * 1000000) + 100000; //генерация невалидного id
  
  // Данные для обновления
  const updateData = {
    title: "Update POST",
    doneStatus: true,
    description: "description"
  };

  const response = await request.post(`${testinfo.project.use.apiURL}/todos/${notExistId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const responseBody = await response.json();

  // Проверяем статус 404
  expect(response.status()).toBe(404); 
  expect(responseBody).toHaveProperty('errorMessages');
  expect(Array.isArray(responseBody.errorMessages)).toBe(true);
  expect(responseBody.errorMessages.length).toBeGreaterThan(0);
  expect(responseBody.errorMessages[0]).toContain(`No such todo entity instance with id == ${notExistId}`);
});


test(" 19 PUT /todos/{id} full (200) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await getResponse.json();
  const firstTodoId = body.todos[0].id;

  // Создаем полную полезную нагрузку для обновления (без id)
  const updateData = {
    title: `Updated Title ${Date.now()}`,
    doneStatus: true,
    description: `Updated Description ${Date.now()}`
  };

  // Выполняем PUT запрос
  const putResponse = await request.put(`${testinfo.project.use.apiURL}/todos/${firstTodoId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const updatedTodo = await putResponse.json();

  expect(putResponse.status()).toBe(200);
  expect(putResponse.headers()["content-type"]).toContain("application/json");
  expect(updatedTodo.id).toBe(firstTodoId);
  expect(updatedTodo.title).toBe(updateData.title);
  expect(updatedTodo.description).toBe(updateData.description);
  expect(updatedTodo.doneStatus).toBe(updateData.doneStatus);
});


test(" 20 PUT /todos/{id} partial (200) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await getResponse.json();
  const todoId = body.todos[0].id;

  // Создаем полную полезную нагрузку для обновления (без id)
  const updateData = {
    title: `Minimal Update ${Date.now()}`,
  };

  // Выполняем PUT запрос
  const putResponse = await request.put(`${testinfo.project.use.apiURL}/todos/${todoId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const updatedTodo = await putResponse.json();

  expect(putResponse.status()).toBe(200);
  expect(putResponse.headers()["content-type"]).toContain("application/json");
  expect(updatedTodo.id).toBe(todoId);
  expect(updatedTodo.title).toBe(updateData.title);
});


test(" 21 PUT /todos/{id} no title (400) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await getResponse.json();
  const todoId = body.todos[0].id;

  // Создаем полную полезную нагрузку для обновления (без заголовка)
  const updateData = {
    doneStatus: true,
    description: `Updated Description ${Date.now()}`
  };

  // Выполняем PUT запрос
  const putResponse = await request.put(`${testinfo.project.use.apiURL}/todos/${todoId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const updatedTodo = await putResponse.json();

  expect(putResponse.status()).toBe(400); 
  expect(updatedTodo).toHaveProperty('errorMessages');
  expect(Array.isArray(updatedTodo.errorMessages)).toBe(true);
  expect(updatedTodo.errorMessages[0]).toContain(`title : field is mandatory`);
});


test(" 22 PUT /todos/{id} no amend id (400) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await getResponse.json();
  const todoId = body.todos[0].id;
   // Создаем новый ID (отличающийся от исходного)
  const newId = todoId + 100;

  // Создаем полную полезную нагрузку для обновлени
  const updateData = {
    id: newId, //меняем id
    title: `Minimal Update ${Date.now()}`,
    doneStatus: true,
    description: `Updated Description ${Date.now()}`
  };

  // Выполняем PUT запрос
  const putResponse = await request.put(`${testinfo.project.use.apiURL}/todos/${todoId}`, {
    headers: { 
      "x-challenger": token,
      "Content-Type": "application/json"
    },
    data: JSON.stringify(updateData)
  }); 

  const responseBody = await putResponse.json();

  expect(putResponse.status()).toBe(400); 
  expect(responseBody).toHaveProperty('errorMessages');
  expect(Array.isArray(responseBody.errorMessages)).toBe(true);
  expect(responseBody.errorMessages.length).toBeGreaterThan(0);

  const expectedErrorMessage = `Can not amend id from ${todoId} to ${newId}`;
  expect(responseBody.errorMessages[0]).toBe(expectedErrorMessage);
});


test(" 23 DELETE /todos/{id} (200) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const  getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await getResponse.json();
  const todoToDelete = body.todos[0];
  const todoId = todoToDelete.id;

// Выполняем DELETE запрос для удаления конкретного элемента
  const deleteResponse = await request.delete(`${testinfo.project.use.apiURL}/todos/${todoId}`, {
    headers: { 
      "x-challenger": token
    }
  });

  const responseBody = await deleteResponse.text();

  expect(deleteResponse.status()).toBe(200);
  expect(responseBody).toBe("");
});

test(" 24 OPTIONS /todos (200)", { tag: '@API' }, async ({ request }, testinfo) => {
  const optionsResponse = await request.fetch(`${testinfo.project.use.apiURL}/todos`, {
    method: 'OPTIONS',
    headers: { 
      "x-challenger": token
    }
  });

  // Основные проверки
  expect(optionsResponse.status()).toBe(200);
  expect(await optionsResponse.text()).toBe(""); // Пустое тело

  // Получаем заголовок Allow
  const allowHeader = optionsResponse.headers()['allow'];
  expect(allowHeader).toBeDefined();
  
  const allowedMethods = allowHeader.split(',').map(method => method.trim());
  
  // Проверяем обязательные методы для REST endpoint
  const expectedMethods = ['GET', 'POST', 'OPTIONS'];
  expectedMethods.forEach(method => {
    expect(allowedMethods).toContain(method);
  });

  // Проверяем
  console.log('=== OPTIONS /todos Response ===');
  console.log('Status:', optionsResponse.status());
  console.log('Allow header:', allowHeader);
  console.log('Allowed methods:', allowedMethods);
  console.log('Content-Length:', optionsResponse.headers()['content-length']);
});

  test(" 25 GET /todos (200) XML ",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/xml"
    }
  }); 
  const getResponse = await response.text();

  const contentType = response.headers()['content-type'];
  expect(contentType).toContain("application/xml");

  // Основные проверки
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");
  // Проверяем XML структуру (без <?xml declaration) =>X ML declaration <?xml version="1.0" encoding="UTF-8"?>
  expect(getResponse).toContain('<todos>');
  expect(getResponse).toContain('</todos>');
  expect(getResponse).toContain('<todo>');
  expect(getResponse).toContain('</todo>');
});


  test(" 26 GET /todos (200) JSON ",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 
  const responseBody = await response.json();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(responseBody).toHaveProperty('todos');
  expect(Array.isArray(responseBody.todos)).toBe(true);
});

 test(" 27 GET /todos (200) ANY ",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "*/*"
    }
  }); 
  const responseBody = await response.json();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(responseBody).toHaveProperty('todos');
  expect(Array.isArray(responseBody.todos)).toBe(true);
});


 test(" 30 GET /todos (406) ",{ tag: '@API' }, async ({ request }, testinfo) => {
  const response = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/gzip"
    }
  }); 
  const responseBody = await response.json();

  expect(response.status()).toBe(406);
  expect(response.ok()).toBe(false);
  expect(responseBody).toHaveProperty('errorMessages');
  expect(responseBody.errorMessages.length).toBeGreaterThan(0);
});


test(" 41 DELETE /heartbeat (405) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const deleteResponse = await request.delete(`${testinfo.project.use.apiURL}/heartbeat`, { // heartbeat существует всегда, не требует предварительного создания
    headers: { 
      "x-challenger": token
    }
  });
  // Проверяем, что статус 405 Method Not Allowed
  expect(deleteResponse.status()).toBe(405);
  
  // Проверяем, что ответ не успешный
  expect(deleteResponse.ok()).toBe(false);
});


test(" 42 PATCH /heartbeat (500) ", { tag: '@API' }, async ({ request }, testinfo) => {
  const deleteResponse = await request.patch(`${testinfo.project.use.apiURL}/heartbeat`, { // heartbeat существует всегда, не требует предварительного создания
    headers: { 
      "x-challenger": token
    }
  });

  expect(deleteResponse.status()).toBe(500);
  
  // Проверяем, что ответ не успешный
  expect(deleteResponse.ok()).toBe(false);
});



test(" 58 DELETE /todos/{id} (200) all ", { tag: '@API' }, async ({ request }, testinfo) => {
    // Получаем текущий список задач
  const getResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  }); 

  const body = await getResponse.json();
  const todos = body.todos;

  // Удаляем задачи до тех пор, пока они не закончатся
  while (todos.length > 0) {
    // Берем последнюю задачу из списка
    const lastTodo = todos[todos.length - 1];
    
    // Удаляем последнюю задачу
    const deleteResponse = await request.delete(`${testinfo.project.use.apiURL}/todos/${lastTodo.id}`, {
      headers: { 
        "x-challenger": token
      }
    });
    
    expect(deleteResponse.status()).toBe(200);
    
    // Обновляем список задач
    const updatedResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
      headers: { 
        "x-challenger": token,
        "Accept": "application/json"
      }
    });
    
    const updatedBody = await updatedResponse.json();
    todos.length = 0; // Очищаем массив
    todos.push(...updatedBody.todos); // Заполняем новыми данными
    
    console.log(`Tasks remaining: ${todos.length}`);
  }
  // Финальная проверка - система пуста
  const finalResponse = await request.get(`${testinfo.project.use.apiURL}/todos`, {
    headers: { 
      "x-challenger": token,
      "Accept": "application/json"
    }
  });
  
  const finalBody = await finalResponse.json();
  expect(finalBody.todos.length).toBe(0);
  console.log('✓ SUCCESS: No tasks remain in the system - all tasks have been deleted');
});



    }); 



 
