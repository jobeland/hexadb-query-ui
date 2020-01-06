import React from 'react';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Collapse from 'react-bootstrap/Collapse';
import {Typeahead} from 'react-bootstrap-typeahead';
import ReactJson from 'react-json-view'
import './App.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Graph from 'vis-react';
import ColorMapper from './colorMapper';

const shortid = require('shortid');

function App() {
  var cachedPredicates = localStorage.getItem('predicates');
  if(cachedPredicates){
    cachedPredicates = cachedPredicates.split(",");
  }
  const [predicates, setPredicates] = React.useState(cachedPredicates || ['type', 'id']);
  const [operations, setOperations] = React.useState(['eq', 'ge', 'gt', 'le', 'lt', 'ne']);
  const [hostUrl, setHostUrl] = React.useState(localStorage.getItem('hostUrl') || '');
  const [storeId, setStoreId] = React.useState(localStorage.getItem('storeId') || '');
  const [filters, setFilters] = React.useState([
    {
      id: shortid.generate(),
      predicate: '',
      operation: '',
      value: ''
    }
  ]);
  const [outgoings, setOutgoings] = React.useState([
    {
      id: shortid.generate(),
      path: '*',
      level: 0,
      target: {
        filters: [
          {
            id: shortid.generate(),
            predicate: '',
            operation: '',
            value: ''
          }
        ] 
      }
    }
  ]);
  const [incomings, setIncomings] = React.useState([
    {
      id: shortid.generate(),
      path: '*',
      level: 0,
      target: {
        filters: [
          {
            id: shortid.generate(),
            predicate: '',
            operation: '',
            value: ''
          }
        ] 
      }
    }
  ]);
  const [jsonResponse, setJsonResponse] = React.useState({});
  const [showJson, setShowJson] = React.useState(false);
  const [showGraph, setShowGraph] = React.useState(true);
  const [showConnectionInfo, setShowConnectionInfo] = React.useState(true);
  const [showFilters, setShowFilters] = React.useState(true);
  const [showOutgoing, setShowOutgoing] = React.useState(false);
  const [showIncoming, setShowIncoming] = React.useState(false);
  const [values, setValues] = React.useState([]);
  const [showAggregates, setShowAggregates] = React.useState(false);
  const [countAggregate, setCountAggregate] = React.useState(false);
  const [colorNodes, setColorNodes] = React.useState(true);

  function handleFilterFormChange(e, currentFilter) {
    setFilters(filters.map(f => f.id === currentFilter.id ? {...f, value: e.target && e.target.value} : f));
  } 

  function handleDeleteFilterForm(currentFilter) {
    setFilters(filters.filter(f => f.id !== currentFilter.id));
  }

  function handleTypeaheadFilterSelection(selected, currentFilter, typeahead){
    setFilters(filters.map(f => f.id === currentFilter.id ? {...f, [typeahead]: selected.length && selected[0]} : f));
  }

  function handleTypeaheadFilterChange(val, currentFilter, typeahead){
    setFilters(filters.map(f => f.id === currentFilter.id ? {...f, [typeahead]: val} : f));
  }

  function renderFilters() {
    var filterGroups = [];
    for(var filter of filters) {
      filterGroups.push(<InputGroup className="input-group">
      <Typeahead
          id={filter.id + "predicate"}
          labelKey="predicate"
          multiple={false}
          options={predicates}
          placeholder="Choose a predicate"
          className="Typeahead"
          value={filter.predicate}
          allowNew={true}
          onChange={((currentFilter) => (selected) => handleTypeaheadFilterSelection(selected, currentFilter, 'predicate'))(filter)}
          onInputChange={((currentFilter) => (val) => handleTypeaheadFilterChange(val, currentFilter, 'predicate'))(filter)}
        />
        <Typeahead
          id={filter.id + "operation"}
          labelKey="operation"
          multiple={false}
          options={operations}
          placeholder="Choose an operation"
          className="Typeahead"
          value={filter.operation}
          onChange={((currentFilter) => (selected) => handleTypeaheadFilterSelection(selected, currentFilter, 'operation'))(filter)}
          onInputChange={((currentFilter) => (val) => handleTypeaheadFilterChange(val, currentFilter, 'operation'))(filter)}
        ></Typeahead>
        <FormControl
          placeholder="value"
          aria-label="value"
          value={filter.value}
          onChange={((currentFilter) => (e) => handleFilterFormChange(e, currentFilter))(filter)}
        />
        <Button variant="danger" onClick={((currentFilter) => () => handleDeleteFilterForm(currentFilter))(filter)}>X</Button>
    </InputGroup>)
    }
    return <>
    {filterGroups}
    </>;
  }

  function handleOutgoingFilterFormChange(e, currentOutgoing, currentFilter) {
    setOutgoings(outgoings.map(o => o.id === currentOutgoing.id
      ?  {...o, target: {...o.target, filters: o.target.filters.map(f => f.id === currentFilter.id 
        ? {...f, value: e.target && e.target.value}
        : f) }}
      : o))
  } 

  function handleOutgoingDeleteFilterForm(currentOutgoing, currentFilter) {
    setOutgoings(outgoings.map(o => o.id === currentOutgoing.id
      ?  {...o, target: {...o.target, filters: o.target.filters.filter(f => f.id !== currentFilter.id)}}
      : o))
  }

  function handleOutgoingDeleteForm(currentOutgoing) {
    setOutgoings(outgoings.filter(o => o.id !== currentOutgoing.id));
  }

  function handleOutgoingTypeaheadFilterSelection(selected, currentOutgoing, currentFilter, typeahead){
    setOutgoings(outgoings.map(o => o.id === currentOutgoing.id
      ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.id === currentFilter.id 
        ? {...f, [typeahead]: selected.length && selected[0]}
        : f) }} 
      : o));
  }

  function handleOutgoingTypeaheadFilterChange(val, currentOutgoing, currentFilter, typeahead){
    setOutgoings(outgoings.map(o => o.id === currentOutgoing.id
      ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.id === currentFilter.id 
        ? {...f, [typeahead]: val}
        : f) }}
      : o));
  }

  function renderOutgoings() {
    var outgoingGroups = [];
    for(var outgoing of outgoings) {
      var filterGroups = [];
      if (!outgoing.target) continue;
      for(var filter of outgoing.target.filters) {
        filterGroups.push(<InputGroup className="input-group">
          <Typeahead
              id={filter.id + "predicate-outgoing"}
              labelKey="predicate"
              multiple={false}
              options={predicates}
              placeholder="Choose a predicate"
              className="Typeahead"
              value={filter.predicate}
              allowNew={true}
              onChange={((currentOutgoing, currentFilter) =>
                (selected) => handleOutgoingTypeaheadFilterSelection(selected, currentOutgoing, currentFilter, 'predicate'))(outgoing, filter)}
              onInputChange={((currentOutgoing, currentFilter) =>
                (val) => handleOutgoingTypeaheadFilterChange(val, currentOutgoing, currentFilter, 'predicate'))(outgoing, filter)}
            />
            <Typeahead
              id={filter.id + "operation-outgoing"}
              labelKey="operation"
              multiple={false}
              options={operations}
              placeholder="Choose an operation"
              className="Typeahead"
              value={filter.operation}
              onChange={((currentOutgoing, currentFilter) =>
                (selected) => handleOutgoingTypeaheadFilterSelection(selected, currentOutgoing, currentFilter, 'operation'))(outgoing, filter)}
              onInputChange={((currentOutgoing, currentFilter) =>
                (val) => handleOutgoingTypeaheadFilterChange(val, currentOutgoing, currentFilter, 'operation'))(outgoing, filter)}
            ></Typeahead>
            <FormControl
              placeholder="value"
              aria-label="value"
              value={filter.value}
              onChange={((currentOutgoing, currentFilter) => (e) => handleOutgoingFilterFormChange(e, currentOutgoing, currentFilter))(outgoing, filter)}
            />
            <Button variant="danger" onClick={((currentOutgoing, currentFilter) => () => handleOutgoingDeleteFilterForm(currentOutgoing, currentFilter))(outgoing, filter)}>X</Button>
          </InputGroup>);
      }
      outgoingGroups.push(<div className="section">
      <Form.Label>
        Path
      </Form.Label>
      <Form.Control
        className="path-input"
        placeholder="path"
        aria-label="path"
        value={outgoing.path}
        onChange={((currentOutgoing) => (e) => setOutgoings(outgoings.map(o => o.id === currentOutgoing.id ? {...o, path: e.target && e.target.value} : o)))(outgoing)}
      />
      <Form.Label>
        Level
      </Form.Label>
      <Form.Control
        className="path-input"
        placeholder="level"
        aria-label="level"
        value={outgoing.level}
        onChange={((currentOutgoing) => (e) => setOutgoings(outgoings.map(o => o.id === currentOutgoing.id ? {...o, level: e.target && e.target.value} : o)))(outgoing)}
      />
      <Form.Label>
        Filters:
      </Form.Label>
      {filterGroups}
      <div className="action-button">
            <Button variant="info" onClick={((currentOutgoing) => () => addOutgoingFilter(currentOutgoing.id))(outgoing)}>Add Filter</Button>
            <Button variant="danger" onClick={((currentOutgoing) => () => handleOutgoingDeleteForm(currentOutgoing))(outgoing)}>Remove</Button>
        </div>
      </div>);
    }
    return <>
    {outgoingGroups}
    </>;
  }

  function addFilter(){
    setFilters([...filters, {
      id: shortid.generate(),
      predicate: '',
      operation: '',
      value: ''
    }]);
  }

  function addOutgoing(){
    setOutgoings([...outgoings, {
      id: shortid.generate(),
      path: '*',
      target: {
        filters: [
          {
            id: shortid.generate(),
            predicate: '',
            operation: '',
            value: ''
          }
        ] 
      }
    }]);
  }

  function addOutgoingFilter(id){
    var updatedOutgoing = outgoings.filter(o => o.id === id)[0];
    updatedOutgoing.target.filters = [...updatedOutgoing.target.filters, {
      id: shortid.generate(),
      predicate: '',
      operation: '',
      value: ''
    }];
    setOutgoings(outgoings.map(o => o.id === id ? updatedOutgoing : o));
  }

  function addIncoming(){
    setIncomings([...incomings, {
      id: shortid.generate(),
      path: '*',
      target: {
        filters: [
          {
            id: shortid.generate(),
            predicate: '',
            operation: '',
            value: ''
          }
        ] 
      }
    }]);
  }

  function addIncomingFilter(id){
    var updatedIncoming = incomings.filter(i => i.id === id)[0];
    updatedIncoming.target.filters = [...updatedIncoming.target.filters, {
      id: shortid.generate(),
      predicate: '',
      operation: '',
      value: ''
    }];
    setIncomings(incomings.map(i => i.id === id ? updatedIncoming : i));
  }

  function handleIncomingFilterFormChange(e, currentIncoming, currentFilter) {
    setIncomings(incomings.map(o => o.id === currentIncoming.id
      ?  {...o, target: {...o.target, filters: o.target.filters.map(f => f.id === currentFilter.id 
        ? {...f, value: e.target && e.target.value}
        : f) }}
      : o))
  } 

  function handleIncomingDeleteFilterForm(currentIncoming, currentFilter) {
    setIncomings(incomings.map(o => o.id === currentIncoming.id
      ?  {...o, target: {...o.target, filters: o.target.filters.filter(f => f.id !== currentFilter.id)}}
      : o))
  }

  function handleIncomingDeleteForm(currentIncoming) {
    setIncomings(incomings.filter(o => o.id !== currentIncoming.id));
  }

  function handleIncomingTypeaheadFilterSelection(selected, currentIncoming, currentFilter, typeahead){
    setIncomings(incomings.map(o => o.id === currentIncoming.id
      ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.id === currentFilter.id 
        ? {...f, [typeahead]: selected.length && selected[0]}
        : f) }} 
      : o));
  }

  function handleIncomingTypeaheadFilterChange(val, currentIncoming, currentFilter, typeahead){
    setIncomings(incomings.map(o => o.id === currentIncoming.id
      ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.id === currentFilter.id 
        ? {...f, [typeahead]: val}
        : f) }}
      : o));
  }

  function renderIncomings() {
    var incomingGroups = [];
    for(var incoming of incomings) {
      var filterGroups = [];
      if (!incoming.target) continue;
      for(var filter of incoming.target.filters) {
        filterGroups.push(<InputGroup className="input-group">
          <Typeahead
              id={filter.id + "predicate-incoming"}
              labelKey="predicate"
              multiple={false}
              options={predicates}
              placeholder="Choose a predicate"
              className="Typeahead"
              value={filter.predicate}
              allowNew={true}
              onChange={((currentIncoming, currentFilter) =>
                (selected) => handleIncomingTypeaheadFilterSelection(selected, currentIncoming, currentFilter, 'predicate'))(incoming, filter)}
              onInputChange={((currentIncoming, currentFilter) =>
                (val) => handleIncomingTypeaheadFilterChange(val, currentIncoming, currentFilter, 'predicate'))(incoming, filter)}
            />
            <Typeahead
              id={filter.id + "operation-incoming"}
              labelKey="operation"
              multiple={false}
              options={operations}
              placeholder="Choose an operation"
              className="Typeahead"
              value={filter.operation}
              onChange={((currentIncoming, currentFilter) =>
                (selected) => handleIncomingTypeaheadFilterSelection(selected, currentIncoming, currentFilter, 'operation'))(incoming, filter)}
              onInputChange={((currentIncoming, currentFilter) =>
                (val) => handleIncomingTypeaheadFilterChange(val, currentIncoming, currentFilter, 'operation'))(incoming, filter)}
            ></Typeahead>
            <FormControl
              placeholder="value"
              aria-label="value"
              value={filter.value}
              onChange={((currentIncoming, currentFilter) => (e) => handleIncomingFilterFormChange(e, currentIncoming, currentFilter))(incoming, filter)}
            />
            <Button variant="danger" onClick={((currentIncoming, currentFilter) => () => handleIncomingDeleteFilterForm(currentIncoming, currentFilter))(incoming, filter)}>X</Button>
          </InputGroup>);
      }
      incomingGroups.push(<div className="section">
      <Form.Label>
        Path
      </Form.Label>
      <Form.Control
        className="path-input"
        placeholder="path"
        aria-label="path"
        value={incoming.path}
        onChange={((currentIncoming) => (e) => setIncomings(outgoings.map(o => o.id === currentIncoming.id ? {...o, path: e.target && e.target.value} : o)))(incoming)}
      />
      <Form.Label>
        Level
      </Form.Label>
      <Form.Control
        className="path-input"
        placeholder="level"
        aria-label="level"
        value={incoming.level}
        onChange={((currentIncoming) => (e) => setIncomings(outgoings.map(o => o.id === currentIncoming.id ? {...o, level: e.target && e.target.value} : o)))(incoming)}
      />
      <Form.Label>
        Filters:
      </Form.Label>
      {filterGroups}
      <div className="action-button">
            <Button variant="info" onClick={((currentIncoming) => () => addIncomingFilter(currentIncoming.id))(incoming)}>Add Filter</Button>
            <Button variant="danger" onClick={((currentIncoming) => () => handleIncomingDeleteForm(currentIncoming))(incoming)}>Remove</Button>
        </div>
      </div>);
    }
    return <>
    {incomingGroups}
    </>;
  }

  async function setConnection() {
    console.log(hostUrl);
    const response =
      await axios.get(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/predicates`);
    console.log(response.data);
    var predicates = response.data.values;
    if(!predicates.includes('id')){
      predicates = [...predicates, 'id'];
    }
    setPredicates(predicates);
    localStorage.setItem('hostUrl', hostUrl);
    localStorage.setItem('storeId', storeId);
    localStorage.setItem('predicates', predicates);
  }

  function anyValidOutgoings() {
    for(var outgoing of outgoings) {
      if(outgoing.target && outgoing.target.filters && outgoing.target.filters.some((filter) => filter.predicate && filter.operation && filter.value)) return true;
    }
    return false;
  }

  function anyValidIncomings() {
    for(var incoming of incomings) {
      if(incoming.target && incoming.target.filters && incoming.target.filters.some((filter) => filter.predicate && filter.operation && filter.value)) return true;
    }
    return false;
  }

  function tryParseInt(str,defaultValue = 0) {
    var retValue = defaultValue;
    if(str) {
      if (!isNaN(str)) {
          retValue = parseInt(str);
      }
    }
    return retValue;
  }

  function tryParseFloat(str,defaultValue = 0) {
    var retValue = defaultValue;
    if(str) {
      if (!isNaN(str)) {
          retValue = parseFloat(str);
      }
    }
    return retValue;
  }
  


  async function runQuery(e, continuation) {
    console.log(filters);
    console.log(outgoings);
    var body = { filter: {}};
    var id = null;
    for(var filter of filters){
      if(filter.predicate === 'id' && filter.operation === 'eq' && filter.value) {
        id = filter.value;
      }
      body.filter[filter.predicate] = { 
        op: filter.operation,
        value: filter.value
      }
      // convert strings to bools
      if (body.filter[filter.predicate].value === "true") {
        body.filter[filter.predicate].value = true;
      }
      if (body.filter[filter.predicate].value === "false") {
        body.filter[filter.predicate].value = false;
      }
      if (!isNaN(parseFloat(body.filter[filter.predicate].value))) {
        body.filter[filter.predicate].value = parseFloat(body.filter[filter.predicate].value);
      }
    }

    if (anyValidOutgoings()){
      body.outgoing = [];
      for(var outgoing of outgoings) {
        var newOutgoing = {
          path: outgoing.path,
          level: outgoing.level,
          target: {
            filter: {}
          }
        };
        if (outgoing.target.filters.filter(f => f.predicate === 'id' && f.operation === 'eq' && f.value).length) {
            delete newOutgoing.target.filter;
            newOutgoing.target = {id: outgoing.target.filters.filter(f => f.predicate === 'id' && f.operation === 'eq')[0].value}
        } 
        else {
          for(var filter of outgoing.target.filters) {
            newOutgoing.target.filter[filter.predicate] = { 
              op: filter.operation,
              value: filter.value
            }
            // convert strings to bools
            if (newOutgoing.target.filter[filter.predicate].value === "true") {
              newOutgoing.target.filter[filter.predicate].value = true;
            }
            if (newOutgoing.target.filter[filter.predicate].value === "false") {
              newOutgoing.target.filter[filter.predicate].value = false;
            }
            if (!isNaN(parseFloat(newOutgoing.target.filter[filter.predicate].value))) {
              newOutgoing.target.filter[filter.predicate].value = parseFloat(newOutgoing.target.filter[filter.predicate].value);
            }
            newOutgoing.level = tryParseInt(newOutgoing.level);
          }
        }
        body.outgoing.push(newOutgoing)
      }
    }

    if (anyValidIncomings()){
      body.incoming = [];
      for(var incoming of incomings) {
        var newIncoming = {
          path: incoming.path,
          level: incoming.level,
          target: {
            filter: {}
          }
        };
        if (incoming.target.filters.filter(f => f.predicate === 'id' && f.operation === 'eq' && f.value).length) {
          delete newIncoming.target.filter;
          newIncoming.target = {id: incoming.target.filters.filter(f => f.predicate === 'id' && f.operation === 'eq')[0].value}
        }  
        else {
          for(var filter of incoming.target.filters) {
            newIncoming.target.filter[filter.predicate] = { 
              op: filter.operation,
              value: filter.value
            }
            // convert strings to bools
            if (newIncoming.target.filter[filter.predicate].value === "true") {
              newIncoming.target.filter[filter.predicate].value = true;
            }
            if (newIncoming.target.filter[filter.predicate].value === "false") {
              newIncoming.target.filter[filter.predicate].value = false;
            }
            if (!isNaN(parseFloat(newIncoming.target.filter[filter.predicate].value))) {
              newIncoming.target.filter[filter.predicate].value = parseFloat(newIncoming.target.filter[filter.predicate].value);
            }
            newIncoming.level = tryParseInt(newIncoming.level);
          }
        }
        body.incoming.push(newIncoming)
      }
    }
    if(continuation) {
      body.continuation = jsonResponse['continuation'];
    }
    if(countAggregate) {
      body.aggregates = [{type : "count"}];
    }

    console.log(body);
    setShowGraph(true);
    const response = id ? await axios.get(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/${id}`) :
      await axios.post(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/query`, body);
    console.log(response);
    var newJson = continuation ? {...response.data, values: [...jsonResponse.values, ...response.data.values]} : response.data;
    setJsonResponse(newJson);

    var newNodes = [];
    var newEdges = [];
    for(var node of newJson.values) {
      var newNode = {id: node.id, label: node.id, title: node.id};
      if (colorNodes) {
        newNode['color'] = ColorMapper.getColorForNode(node);
      }
      newNodes.push(newNode);
      const toAdd = tryAddNodeToGraph(node);
      newNodes = [...newNodes, ...toAdd.nodes];
      newEdges = [...newEdges, ...toAdd.edges];
    }
    setShowGraph(true);
    setGraph({nodes: newNodes, edges: newEdges});

    setShowJson(true);
  }

  function tryAddNodeToGraph(node){
    var nodes = [];
    var edges = [];
    for(var propertyKey in node){
      var property = node[propertyKey];
      if(property === null) return { nodes, edges};
      if (Array.isArray(property)){
        for(var item of property){
          if (!item.id) continue;
          var newNode = {id: item.id, label: item.id, title: item.id};
          if (colorNodes) {
            newNode['color'] = ColorMapper.getColorForNode(item);
          }
          nodes.push(newNode)
          edges.push({id: `${node.id}-to-${item.id}`, from: node.id, to: item.id})
        }
      }
      else if (typeof property === 'object'){
        if (!property.id) continue;
        var newNode = {id: property.id, label: property.id, title: property.id};
        if (colorNodes) {
          newNode['color'] = ColorMapper.getColorForNode(property);
        }
        nodes.push(newNode)
        edges.push({id: `${node.id}-to-${property.id}`, from: node.id, to: property.id})
      }
    }
    return {nodes, edges};
  }

  function redrawGraph(useColor) {
    var edges = [];
    var newNodes = [];
    for(var node of graph.nodes) {
      var newNode = {id: node.id, label: node.id, title: node.id};
      if (useColor) {
        newNode['color'] = ColorMapper.getColorForNode(node);
      }
      newNodes.push(newNode);
    }
    for(var edge of graph.edges){
      edges.push(edge);
    }
    setGraph({
      nodes: [
      ],
      edges: [
      ]
    });
    setTimeout(() => {
      setShowGraph(true);
      setGraph({...graph, nodes: newNodes, edges});
    }, 1);
  }

  async function nodeSelected(selected) {
    console.log(selected);
    if(selected.name === 'id') {
      var nodeToUpdate = jsonResponse;
      for(var i of selected.namespace){
        nodeToUpdate = nodeToUpdate[i];
      }

      const response = await axios.get(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/${encodeURIComponent(selected.value)}`);
      console.log(response);
      var graphUpdate = tryAddNodeToGraph(response.data);
      setGraph({nodes: [...graph.nodes, ...graphUpdate.nodes], edges: [...graph.edges, ...graphUpdate.edges]});

      nodeToUpdate = {...nodeToUpdate, ...response.data};
      for(var i = selected.namespace.length - 1; i >= 0; i--){
        var parentNode = jsonResponse;
        for(var j = 0; j < i; j++){
          parentNode = parentNode[selected.namespace[j]];
        }
        parentNode[selected.namespace[i]] = nodeToUpdate;
        nodeToUpdate = parentNode;
      }
      setJsonResponse(JSON.parse(JSON.stringify(nodeToUpdate)));
    }
    if(selected.namespace && selected.namespace.length === 1 && selected.namespace[0] === 'continuation'){
      runQuery(null, jsonResponse.continuation);
    }
  }

const [graph, setGraph] = React.useState({
  nodes: [
  ],
  edges: [
  ]
});

var events = {
  select: async function(event) {
      var { nodes, edges } = event;
      console.log(event);
      if(!nodes.length) return;
      const response = await axios.get(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/${encodeURIComponent(nodes[0])}`);
      console.log(response);
      var graphUpdate = tryAddNodeToGraph(response.data);
      setGraph({nodes: [...graph.nodes, ...graphUpdate.nodes], edges: [...graph.edges, ...graphUpdate.edges]});
      setJsonResponse(JSON.parse(JSON.stringify(response.data)));
  }
};

  return (
    <div className="App">
      <Jumbotron>
        <h1>
          HexDb Query Builder
        </h1>
      </Jumbotron>
      <div className="connection-info">
        <h5 className="section-title" onClick={() => setShowConnectionInfo(!showConnectionInfo)}>
          Connection Info
        </h5>
        <Collapse in={showConnectionInfo}>
          <div>
            <Form className="section">
              <Form.Group controlId="formBasicEmail">
                <Form.Label>Host Url</Form.Label>
                <Form.Control type="text" placeholder="https://YourHost:YourPort" value={hostUrl} onChange={(e) => setHostUrl(e.target.value)}/>
                <Form.Label>Store Id</Form.Label>
                <Form.Control type="text" placeholder="abc123" value={storeId} onChange={(e) => setStoreId(e.target.value)}/>
              </Form.Group>
            </Form>
            <div className="action-button">
              <Button variant="info" onClick={setConnection}>Set Connection</Button>
            </div>
          </div>
      </Collapse>
      </div>
      <hr/>
      <h5 className="section-title" onClick={() => setShowFilters(!showFilters)}>
        Filters
      </h5>
      <Collapse in={showFilters}>
        <div>
          {renderFilters()}
          <div className="action-button">
              <Button variant="info" onClick={addFilter}>Add Filter</Button>
          </div>
        </div>
      </Collapse>
      <hr/>
      <h5 className="section-title" onClick={() => setShowOutgoing(!showOutgoing)}>
        Outgoing
      </h5>
      <Collapse in={showOutgoing}>
        <div>
          {renderOutgoings()}
          <div className="action-button">
              <Button variant="info" onClick={addOutgoing}>Add Outgoing</Button>
          </div>
        </div>
      </Collapse>
      <hr/>
      <h5 className="section-title" onClick={() => setShowIncoming(!showIncoming)}>
        Incoming
      </h5>
      <Collapse in={showIncoming}>
        <div>
          {renderIncomings()}
          <div className="action-button">
              <Button variant="info" onClick={addIncoming}>Add Incoming</Button>
          </div>
        </div>
      </Collapse>
      <hr/>
      <h5 className="section-title" onClick={() => setShowAggregates(!showAggregates)}>
        Aggregates
      </h5>
      <Collapse in={showAggregates}>
        <div className="section">
        <Form.Check 
          type='switch'
          checked={countAggregate}
          onChange={() => setCountAggregate(!countAggregate)}
          id={`aggregates-count-switch`}
          name='aggregates-switch'
          label={`Count`}
        />
        </div>
      </Collapse>
      <hr/>
      <div className="action-button">
        <Button variant="primary" onClick={runQuery}>Run Query</Button>
      </div>
      <hr/>
      <div>
        <h5 className="section-title" onClick={() => setShowGraph(!showGraph)}>
          Query Response Graph
        </h5>
          <Collapse in={showGraph}>
          <div className="section query-response">
          {/* <Button variant="danger" onClick={expandAll}>Expand All (DANGER)</Button> */}
          <Form.Check 
            type='switch'
            checked={colorNodes}
            onChange={() => {
              setColorNodes(!colorNodes);
              redrawGraph(!colorNodes);
            }}
            id={`colornode-switch`}
            name='colornode-switch'
            label={`Color Nodes`}
          />
          <Graph
                graph={graph}
                options={{
                  configure: {
                    enabled: false,
                    filter: 'physics',
                    showButton: false
                  },
                  layout: {
                    // hierarchical: {
                    //   enabled: true,
                    //   nodeSpacing: 425,
                    //   blockShifting: false,
                    //   edgeMinimization: false,
                    //   sortMethod: "directed"
                    // },
                    hierarchical: false,
                    improvedLayout: true,
                },
                physics: {
                  enabled: true,
                  forceAtlas2Based: {
                    gravitationalConstant: -146,
                    centralGravity: 0.01,
                    springConstant: 0.1,
                    springLength: 30,
                    damping: 1,
                    avoidOverlap: 0.36
                  },
                  maxVelocity: 140,
                  minVelocity: 1.87,
                  solver: 'forceAtlas2Based',
                  adaptiveTimestep: true,
                  stabilization: true
                },
                nodes: {
                  fixed: false,
                  // scaling: {
                  //   label: true
                  // },
                  shape: 'dot',
                  shapeProperties : {
                    interpolation: false
                  }
                },
                edges: {
                  smooth: {
                    enabled: true,
                    type: "continuous",
                    roundness: 0.5
                  }
                },
                manipulation: false,
                interaction:{
                  dragNodes:false,
                  dragView: true
                }
                  // autoResize: true,
                  // height: '100%',
                  // width: '100%',
                  // locale: 'en',
                  // clickToUse: false,
                }
                }
                events={events}
                style={ { width: "100%", height: "1500px" }}
                // getNetwork={getNetwork}
                // getEdges={getEdges}
                // getNodes={getNodes}
                // vis={vis => (this.vis = vis)}
            />
          </div>
        </Collapse>
      </div>
      <hr/>
      <div>
        <h5 className="section-title" onClick={() => setShowJson(!showJson)}>
          Query Response JSON
        </h5>
        <Collapse in={showJson}>
          <div className="section query-response">
            <ReactJson src={jsonResponse} onSelect={nodeSelected}></ReactJson>
            {/* <pre>{jsonResponse}</pre> */}
          </div>
        </Collapse>
      </div>
      <hr/>
      
    </div>
  );
}



export default App;