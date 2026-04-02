"""
Agilitas Core Schemas - Ported from .NET Agilitas.Data
MB-047 Migration Track
"""

from typing import List, Optional, TypedDict, Union
from datetime import datetime
from enum import Enum

class TranscriptPartType(str, Enum):
    SystemPrompt = "SystemPrompt"
    Agent = "Agent"
    Customer = "Customer"

class TranscriptPart(TypedDict):
    type: TranscriptPartType
    text: str

class TranscriptData(TypedDict):
    dateTime: Union[datetime, str]
    agent: Optional[str]
    customer: Optional[str]
    fullTranscript: str
    customerTranscript: str
    parts: List[TranscriptPart]

class PainPointCategory(TypedDict):
    id: int
    isPredefined: Union[bool, int]
    name: str
    issues: Optional[List['PainPointIssue']]

class PainPointIssue(TypedDict):
    id: int
    isPredefined: Union[bool, int]
    name: str
    categoryId: int
    category: Optional[PainPointCategory]
